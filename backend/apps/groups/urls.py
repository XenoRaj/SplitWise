from django.urls import path
from . import views

app_name = 'groups'

urlpatterns = [
    path('', views.GroupListCreateView.as_view(), name='group_list_create'),
    path('<int:pk>/', views.GroupDetailView.as_view(), name='group_detail'),
    path('<int:group_id>/members/', views.add_member_to_group, name='add_member'),
    path('<int:group_id>/members/<int:user_id>/', views.remove_member_from_group, name='remove_member'),
]