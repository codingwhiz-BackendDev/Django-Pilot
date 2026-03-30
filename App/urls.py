from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login, name='login'),
    path('register', views.register, name='register'),
    path('logout', views.logout, name='logout'),
    path('verify-email/<uidb64>/<token>/',views.verify_email,name='verify_email'),
    path('resend-verification/',views.resend_verification,name='resend_verification'),
    path("forgot-password/", views.forgot_password, name="forgot_password"),
    path("reset-password/<uidb64>/<token>/", views.reset_password, name="reset_password"),
    path('dashboard', views.dashboard, name='dashboard'),
]

