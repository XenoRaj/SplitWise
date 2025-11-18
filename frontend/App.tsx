// /**
//  * Sample React Native App
//  * https://github.com/facebook/react-native
//  *
//  * @format
//  */

// import { NewAppScreen } from '@react-native/new-app-screen';
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
// import {
//   SafeAreaProvider,
//   useSafeAreaInsets,
// } from 'react-native-safe-area-context';

// function App() {
//   const isDarkMode = useColorScheme() === 'dark';

//   return (
//     <SafeAreaProvider>
//       <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//       <AppContent />
//     </SafeAreaProvider>
//   );
// }

// function AppContent() {
//   const safeAreaInsets = useSafeAreaInsets();

//   return (
//     <View style={styles.container}>
//       <NewAppScreen
//         templateFileName="App.tsx"
//         safeAreaInsets={safeAreaInsets}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

// export default App;
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { PasswordResetScreen } from './components/PasswordResetScreen';
import { TwoFactorScreen } from './components/TwoFactorScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { AddExpenseScreen } from './components/AddExpenseScreen';
import { ExpenseDetailsScreen } from './components/ExpenseDetailsScreen';
import { GroupsScreen } from './components/GroupsScreen';
import { GroupDetailsScreen } from './components/GroupDetailsScreen';
import { ExpenseCreatorScreen } from './components/ExpenseCreatorScreen';
import { VerificationCompletedScreen } from './components/VerificationCompletedScreen';
import { VerificationRejectedScreen } from './components/VerificationRejectedScreen';
import { VerificationPendingScreen } from './components/VerificationPendingScreen';
import { SettlePaymentScreen } from './components/SettlePaymentScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { SuccessScreen } from './components/SuccessScreen';
import { ErrorScreen } from './components/ErrorScreen';

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

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
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

  const login = () => {
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  const showLoading = (callback: () => void, duration: number = 2000) => {
    // In RN, you might use a modal or loading state
    setTimeout(callback, duration);
  };

  const commonProps = {
    user,
    login,
    logout,
    showLoading,
    expenses: mockExpenses,
    groups: mockGroups,
    selectedExpense,
    selectedGroup,
    successMessage,
    errorMessage,
  };

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="welcome"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="welcome">
            {(props) => <WelcomeScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="login">
            {(props) => <LoginScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="signup">
            {(props) => <SignupScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="password-reset">
            {(props) => <PasswordResetScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="two-factor">
            {(props) => <TwoFactorScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="dashboard">
            {(props) => <DashboardScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="add-expense">
            {(props) => <AddExpenseScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="expense-details">
            {(props) => <ExpenseDetailsScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="groups">
            {(props) => <GroupsScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="group-details">
            {(props) => <GroupDetailsScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="expense-creator">
            {(props) => <ExpenseCreatorScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="verification-completed">
            {(props) => <VerificationCompletedScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="verification-rejected">
            {(props) => <VerificationRejectedScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="verification-pending">
            {(props) => <VerificationPendingScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="settle-payment">
            {(props) => <SettlePaymentScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="profile">
            {(props) => <ProfileScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="loading">
            {(props) => <LoadingScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="success">
            {(props) => <SuccessScreen {...props} {...commonProps} />}
          </Stack.Screen>
          <Stack.Screen name="error">
            {(props) => <ErrorScreen {...props} {...commonProps} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}