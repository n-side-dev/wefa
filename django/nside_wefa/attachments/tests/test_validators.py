"""Validator-level tests: MIME sniffing, whitelist, size, hash, sanitisation."""

from __future__ import annotations

import hashlib
import io

import pytest
from django.core.exceptions import ValidationError

from nside_wefa.attachments.validators import (
    compute_file_hash,
    sanitise_filename,
    sniff_content_type,
    validate_content_type,
    validate_size,
)


class TestSniffContentType:
    def test_png_is_detected(self, png_bytes):
        stream = io.BytesIO(png_bytes)
        result = sniff_content_type(stream, sniff_bytes=2048)
        assert result.content_type == "image/png"

    def test_pdf_is_detected(self, pdf_bytes):
        stream = io.BytesIO(pdf_bytes)
        result = sniff_content_type(stream, sniff_bytes=2048)
        assert result.content_type == "application/pdf"

    def test_stream_is_rewound(self, png_bytes):
        stream = io.BytesIO(png_bytes)
        sniff_content_type(stream, sniff_bytes=2048)
        assert stream.tell() == 0


class TestValidateContentType:
    def test_passes_when_in_whitelist(self):
        validate_content_type("image/png", ["image/png", "image/jpeg"])

    def test_rejects_when_outside_whitelist(self):
        with pytest.raises(ValidationError) as exc_info:
            validate_content_type("application/x-msdownload", ["application/pdf"])
        assert exc_info.value.code == "attachments_content_type_not_allowed"

    def test_rejects_when_whitelist_is_empty(self):
        with pytest.raises(ValidationError) as exc_info:
            validate_content_type("image/png", [])
        assert exc_info.value.code == "attachments_no_whitelist"

    def test_no_partial_or_wildcard_match(self):
        """`image/*` is not a wildcard — explicit MIMEs only."""
        with pytest.raises(ValidationError):
            validate_content_type("image/png", ["image/*"])


class TestValidateSize:
    def test_passes_under_limit(self):
        validate_size(1024, 2048)

    def test_passes_when_no_limit(self):
        validate_size(10**9, None)

    def test_rejects_over_limit(self):
        with pytest.raises(ValidationError) as exc_info:
            validate_size(2049, 2048)
        assert exc_info.value.code == "attachments_size_exceeded"


class TestComputeFileHash:
    def test_hash_matches_hashlib_sha256(self, png_bytes):
        stream = io.BytesIO(png_bytes)
        digest, count = compute_file_hash(stream, algorithm="sha256")
        assert digest == hashlib.sha256(png_bytes).hexdigest()
        assert count == len(png_bytes)

    def test_streaming_size_check_rejects_oversize(self):
        stream = io.BytesIO(b"x" * 200)
        with pytest.raises(ValidationError) as exc_info:
            compute_file_hash(stream, algorithm="sha256", max_size=100)
        assert exc_info.value.code == "attachments_size_exceeded"

    def test_unknown_algorithm_raises_value_error(self):
        with pytest.raises(ValueError):
            compute_file_hash(io.BytesIO(b"x"), algorithm="not-a-real-algo")

    def test_one_byte_change_changes_hash(self):
        a, _ = compute_file_hash(io.BytesIO(b"hello"), algorithm="sha256")
        b, _ = compute_file_hash(io.BytesIO(b"hellp"), algorithm="sha256")
        assert a != b

    def test_stream_is_rewound(self, png_bytes):
        stream = io.BytesIO(png_bytes)
        compute_file_hash(stream, algorithm="sha256")
        assert stream.tell() == 0


class TestSanitiseFilename:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("", "file"),
            ("normal.pdf", "normal.pdf"),
            ("../../etc/passwd", "passwd"),
            ("\\\\share\\evil.exe", "evil.exe"),
            ("a/b/c.txt", "c.txt"),
            ("foo\x00bar.png", "foobar.png"),
            (".", "file"),
            ("..", "file"),
        ],
    )
    def test_path_traversal_and_control_chars(self, raw, expected):
        assert sanitise_filename(raw) == expected

    def test_clamps_long_names_preserving_extension(self):
        long = "x" * 500 + ".png"
        out = sanitise_filename(long)
        assert out.endswith(".png")
        assert len(out) <= 200
