"""
URL patterns for the reusable AI assistant app.
"""

from django.urls import path

from nside_wefa.ai_assistant.views import AssistantRecipeView

app_name = "ai_assistant"

urlpatterns = [
    path("recipes/", AssistantRecipeView.as_view(), name="recipes"),
]
