from django.urls import path
from . import views

app_name = 'expenses'

urlpatterns = [
    path('', views.ExpenseListCreateView.as_view(), name='expense_list_create'),
    path('<int:pk>/', views.ExpenseDetailView.as_view(), name='expense_detail'),
    path('dashboard/', views.user_dashboard_summary, name='dashboard_summary'),
    path('groups/<int:group_id>/', views.group_expenses, name='group_expenses'),
    path('settlements/', views.SettlementListCreateView.as_view(), name='settlement_list_create'),
    path('settlements/<int:settlement_id>/confirm/', views.confirm_settlement, name='confirm_settlement'),
    path('settlements/create/', views.create_settlement, name='create_settlement'),
    path('settlements/history/', views.user_settlement_history, name='settlement_history'),
    path('debts/', views.calculate_user_debts, name='calculate_debts'),
    path('debts/groups/<int:group_id>/', views.calculate_user_debts, name='calculate_group_debts'),
]