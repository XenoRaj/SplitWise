import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthNavigator } from './navigation/AuthNavigator';
import { MainNavigator } from './navigation/MainNavigator';
import { LoadingScreen } from './components/LoadingScreen';

export type Screen =
  | "welcome"
  | "login"
  | "signup"
  | "password-reset"
  | "two-factor"
  | "dashboard"
  | "add-expense"
  | "expense-details"
  | "groups"
  | "group-details"
  | "expense-creator"
  | "verification-completed"
  | "verification-rejected"
  | "verification-pending"
  | "settle-payment"
  | "profile"
  | "loading"
  | "success"
  | "error";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  balance: number;
  twoFactorEnabled: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidBy: string;
  splitWith: string[];
  category: string;
  receipt?: string;
  settled: boolean;
  comments: Array<{
    id: string;
    user: string;
    message: string;
    timestamp: string;
  }>;
}

export interface GroupExpense {
  id: string;
  title: string;
  amount: number;
  creator: string;
  status: "completed" | "pending" | "rejected";
  category: string;
  date: string;
  participants: string[];
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  totalExpenses: number;
  balance: number;
  avatar: string;
  expenses: GroupExpense[];
}

// Main App Navigator that uses auth context
function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Debug logging
  console.log('AppNavigator render - Auth State:', {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    userEmail: user?.email
  });
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Mock data (same as web version)
  const mockUser: User = {
    id: "1",
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    avatar:
      "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMGF2YXRhciUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTEyNjA1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    balance: -42.5,
    twoFactorEnabled: true,
  };

  const mockExpenses: Expense[] = [
    {
      id: "1",
      title: "Dinner at Italiano",
      amount: 85.6,
      date: "2024-09-28",
      paidBy: "Alex Johnson",
      splitWith: ["Sarah Chen", "Mike Wilson", "Emily Davis"],
      category: "Food & Dining",
      settled: false,
      comments: [
        {
          id: "1",
          user: "Sarah Chen",
          message: "Thanks for organizing!",
          timestamp: "2024-09-28T20:30:00Z",
        },
      ],
    },
    {
      id: "2",
      title: "Uber to Airport",
      amount: 32.4,
      date: "2024-09-27",
      paidBy: "Mike Wilson",
      splitWith: ["Alex Johnson"],
      category: "Transportation",
      settled: true,
      comments: [],
    },
  ];

  const mockGroups: Group[] = [
    {
      id: "1",
      name: "Weekend Trip",
      members: [
        "Alex Johnson",
        "Sarah Chen",
        "Mike Wilson",
        "Emily Davis",
      ],
      totalExpenses: 485.3,
      balance: -42.5,
      avatar: "🏝️",
      expenses: [
        {
          id: "1",
          title: "Hotel Booking",
          amount: 280.0,
          creator: "Alex Johnson",
          status: "completed",
          category: "Accommodation",
          date: "2024-09-25",
          participants: [
            "Alex Johnson",
            "Sarah Chen",
            "Mike Wilson",
            "Emily Davis",
          ],
        },
        {
          id: "2",
          title: "Dinner at Restaurant",
          amount: 125.3,
          creator: "Sarah Chen",
          status: "pending",
          category: "Food & Dining",
          date: "2024-09-26",
          participants: [
            "Alex Johnson",
            "Sarah Chen",
            "Mike Wilson",
          ],
        },
        {
          id: "3",
          title: "Gas for Car Rental",
          amount: 80.0,
          creator: "Mike Wilson",
          status: "rejected",
          category: "Transportation",
          date: "2024-09-27",
          participants: ["Alex Johnson", "Mike Wilson"],
        },
      ],
    },
    {
      id: "2",
      name: "Office Lunch",
      members: ["Alex Johnson", "John Smith", "Lisa Brown"],
      totalExpenses: 156.8,
      balance: 12.2,
      avatar: "🍽️",
      expenses: [
        {
          id: "4",
          title: "Pizza Order",
          amount: 89.5,
          creator: "John Smith",
          status: "completed",
          category: "Food & Dining",
          date: "2024-09-20",
          participants: [
            "Alex Johnson",
            "John Smith",
            "Lisa Brown",
          ],
        },
        {
          id: "5",
          title: "Coffee & Snacks",
          amount: 67.3,
          creator: "Alex Johnson",
          status: "pending",
          category: "Food & Dining",
          date: "2024-09-22",
          participants: ["Alex Johnson", "Lisa Brown"],
        },
      ],
    },
  ];

  const showLoading = (callback: () => void, duration: number = 2000) => {
    setTimeout(callback, duration);
  };

  const commonProps = {
    user: user || mockUser, // Use real user data when available, fallback to mock
    showLoading,
    expenses: mockExpenses,
    groups: mockGroups,
    selectedExpense,
    selectedGroup,
    successMessage,
    errorMessage,
  };

  // Show loading screen while checking auth status
  if (isLoading) {
    return <LoadingScreen {...commonProps} />;
  }

  // Render appropriate navigator based on auth state
  return isAuthenticated ? 
    <MainNavigator {...commonProps} /> : 
    <AuthNavigator {...commonProps} />;
}

// Main App component with providers
export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}