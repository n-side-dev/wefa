"""Tests for the primitive validators in ``nside_wefa.utils.checks``."""

from django.test import TestCase

from nside_wefa.utils.checks import (
    validate_bool,
    validate_dotted_path_callable,
    validate_model_label,
    validate_model_label_dict,
    validate_optional_positive_int,
    validate_string_list,
)


class ValidateBoolTest(TestCase):
    def test_accepts_true_false(self):
        self.assertEqual(validate_bool("X")(True), [])
        self.assertEqual(validate_bool("X")(False), [])

    def test_rejects_other_types(self):
        for value in (0, 1, "true", None, [], {}):
            errors = validate_bool("X")(value)
            self.assertEqual(len(errors), 1, f"value={value!r}")
            self.assertIn("must be a boolean", errors[0].msg)


class ValidateOptionalPositiveIntTest(TestCase):
    def test_accepts_none_and_positive_ints(self):
        validator = validate_optional_positive_int("X")
        self.assertEqual(validator(None), [])
        self.assertEqual(validator(1), [])
        self.assertEqual(validator(365), [])

    def test_rejects_zero_negative_bool_string(self):
        validator = validate_optional_positive_int("X")
        for value in (0, -1, True, False, "5"):
            errors = validator(value)
            self.assertEqual(len(errors), 1, f"value={value!r}")


class ValidateStringListTest(TestCase):
    def test_accepts_list_of_non_empty_strings(self):
        self.assertEqual(validate_string_list("X")(["a", "b"]), [])

    def test_rejects_non_list(self):
        errors = validate_string_list("X")("a")
        self.assertEqual(len(errors), 1)

    def test_rejects_empty_or_non_string_entries(self):
        errors = validate_string_list("X")(["a", "", 1])
        self.assertEqual(len(errors), 2)

    def test_allowed_constraint(self):
        validator = validate_string_list("X", allowed=["a", "b"])
        self.assertEqual(validator(["a"]), [])
        errors = validator(["a", "c"])
        self.assertEqual(len(errors), 1)
        self.assertIn("not allowed", errors[0].msg)


class ValidateDottedPathCallableTest(TestCase):
    def test_accepts_callable(self):
        self.assertEqual(
            validate_dotted_path_callable("X")("django.utils.timezone.now"), []
        )

    def test_rejects_non_dotted_string(self):
        self.assertEqual(len(validate_dotted_path_callable("X")(123)), 1)
        self.assertEqual(len(validate_dotted_path_callable("X")("nodot")), 1)

    def test_rejects_unknown_module(self):
        errors = validate_dotted_path_callable("X")("nope.unknown.fn")
        self.assertEqual(len(errors), 1)
        self.assertIn("could not be imported", errors[0].msg)

    def test_rejects_missing_attribute(self):
        errors = validate_dotted_path_callable("X")("django.conf.no_such_attr")
        self.assertEqual(len(errors), 1)
        self.assertIn("has no attribute", errors[0].msg)

    def test_rejects_non_callable(self):
        errors = validate_dotted_path_callable("X")("django.conf.settings")
        self.assertEqual(len(errors), 1)
        self.assertIn("not callable", errors[0].msg)


class ValidateModelLabelTest(TestCase):
    def test_accepts_known_label(self):
        self.assertIsNone(validate_model_label("auth.User"))

    def test_rejects_malformed(self):
        self.assertIsNotNone(validate_model_label(None))
        self.assertIsNotNone(validate_model_label("noseparator"))

    def test_rejects_unknown(self):
        self.assertIsNotNone(validate_model_label("noapp.NoModel"))


class ValidateModelLabelDictTest(TestCase):
    def test_accepts_resolvable_dict(self):
        validator = validate_model_label_dict("X")
        self.assertEqual(validator({"auth.User": {}}), [])

    def test_rejects_non_dict(self):
        errors = validate_model_label_dict("X")(["auth.User"])
        self.assertEqual(len(errors), 1)

    def test_rejects_unresolvable_label(self):
        errors = validate_model_label_dict("X")({"none.Model": {}})
        self.assertTrue(any("could not be resolved" in e.msg for e in errors))

    def test_rejects_non_dict_options(self):
        errors = validate_model_label_dict("X")({"auth.User": "no"})
        self.assertTrue(any("options must be a dict" in e.msg for e in errors))
