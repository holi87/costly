import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { ExpensesPage } from "./pages/ExpensesPage";
import { AddExpensePage } from "./pages/AddExpensePage";
import { AdminPage } from "./pages/AdminPage";
import { EditExpensePage } from "./pages/EditExpensePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/add" element={<AddExpensePage />} />
          <Route path="/expenses/:id/edit" element={<EditExpensePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
