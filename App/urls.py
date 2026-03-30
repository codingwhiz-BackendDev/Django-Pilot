from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login, name='login'),
    path('register', views.register, name='register'),
    path('verify-email/<uidb64>/<token>/',views.verify_email,name='verify_email'),
    path('resend-verification/',views.resend_verification,name='resend_verification'),
    path('dashboard', views.dashboard, name='dashboard'),
]

