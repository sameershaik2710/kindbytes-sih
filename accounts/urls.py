from django.urls import path

from . import views

urlpatterns = [
    path("signup/", views.signup, name="signup"),
    path("login/", views.login_view, name="login"),
    path("demo/", views.demo_login, name="demo-login"),
    path("logout/", views.logout_view, name="logout"),
]
