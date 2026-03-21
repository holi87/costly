import { useEffect, useState } from "react";
import { Header } from "../components/layout/Header";
import { CategoryList } from "../components/categories/CategoryList";
import { CategoryForm } from "../components/categories/CategoryForm";
import { useExpensesStore } from "../store/expenses";
import type { Category } from "../api/client";
import { Plus } from "lucide-react";

export function AdminPage() {
  const { categories, fetchCategories } = useExpensesStore();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSaved = () => {
    setShowForm(false);
    setEditingCategory(undefined);
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(undefined);
  };

  return (
    <>
      <Header title="Kategorie" />
      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {showForm ? (
          <CategoryForm
            category={editingCategory}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
            aria-label="Dodaj nową kategorię"
          >
            <Plus size={18} />
            Dodaj kategorię
          </button>
        )}
        <CategoryList
          categories={categories}
          onEdit={handleEdit}
          onDeleted={fetchCategories}
        />
      </div>
    </>
  );
}
