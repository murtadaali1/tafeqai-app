"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number | null;
  created_at: string;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("يرجى تسجيل الدخول أولاً.");
      return;
    }

    const { data, error } = await supabase
      .from("services")
      .select(
        "id, name, description, price, duration_minutes, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setServices(data || []);
  }

  function clearForm() {
    setName("");
    setDescription("");
    setPrice("");
    setDuration("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(service: Service) {
    setEditingId(service.id);

    setName(service.name);
    setDescription(service.description || "");
    setPrice(
      service.price !== null
        ? String(service.price)
        : ""
    );
    setDuration(
      service.duration_minutes !== null
        ? String(service.duration_minutes)
        : ""
    );

    setShowForm(true);
    setMessage("");
  }

  async function saveService(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("يرجى تسجيل الدخول أولاً.");
      setLoading(false);
      return;
    }

    if (!name.trim()) {
      setMessage("يرجى إدخال اسم الخدمة.");
      setLoading(false);
      return;
    }

    const priceValue =
      price.trim() === ""
        ? null
        : Number(price);

    const durationValue =
      duration.trim() === ""
        ? null
        : Number(duration);

    if (
      priceValue !== null &&
      (Number.isNaN(priceValue) ||
        priceValue < 0)
    ) {
      setMessage("يرجى إدخال سعر صحيح.");
      setLoading(false);
      return;
    }

    if (
      durationValue !== null &&
      (Number.isNaN(durationValue) ||
        durationValue < 0)
    ) {
      setMessage(
        "يرجى إدخال مدة صحيحة."
      );
      setLoading(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("services")
        .update({
          name: name.trim(),
          description:
            description.trim() || null,
          price: priceValue,
          duration_minutes: durationValue,
        })
        .eq("id", editingId)
        .eq("user_id", user.id);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage(
        "تم تعديل الخدمة بنجاح."
      );
    } else {
      const { error } = await supabase
        .from("services")
        .insert({
          user_id: user.id,
          name: name.trim(),
          description:
            description.trim() || null,
          price: priceValue,
          duration_minutes: durationValue,
        });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage(
        "تمت إضافة الخدمة بنجاح."
      );
    }

    clearForm();

    await loadServices();

    setLoading(false);
  }

  async function deleteService(id: string) {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذه الخدمة؟"
    );

    if (!confirmed) return;

    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("يرجى تسجيل الدخول أولاً.");
      return;
    }

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setServices((current) =>
      current.filter(
        (service) => service.id !== id
      )
    );

    setMessage(
      "تم حذف الخدمة بنجاح."
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-6 py-12 text-white"
    >
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-10 flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold">
              الخدمات
            </h1>

            <p className="mt-2 text-slate-400">
              إدارة الخدمات التي يقدمها نشاطك التجاري.
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                clearForm();
              } else {
                setShowForm(true);
                setMessage("");
              }
            }}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
          >
            {showForm
              ? "إغلاق"
              : "إضافة خدمة"}
          </button>

        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm text-blue-400">
            {message}
          </div>
        )}

        {/* FORM */}

        {showForm && (
          <form
            onSubmit={saveService}
            className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >

            <h2 className="mb-6 text-2xl font-bold">
              {editingId
                ? "تعديل الخدمة"
                : "إضافة خدمة"}
            </h2>

            {/* NAME */}

            <label className="mb-2 block text-sm font-medium text-slate-300">
              اسم الخدمة
            </label>

            <input
              type="text"
              placeholder="مثال: تبديل شاشة آيفون"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
              className="mb-5 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {/* DESCRIPTION */}

            <label className="mb-2 block text-sm font-medium text-slate-300">
              وصف الخدمة
            </label>

            <textarea
              placeholder="اكتب وصفاً مختصراً للخدمة..."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={4}
              className="mb-5 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {/* PRICE */}

            <label className="mb-2 block text-sm font-medium text-slate-300">
              السعر
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="مثال: 25000"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              className="mb-5 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {/* DURATION */}

            <label className="mb-2 block text-sm font-medium text-slate-300">
              مدة الخدمة بالدقائق
            </label>

            <input
              type="number"
              min="0"
              placeholder="مثال: 60"
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value)
              }
              className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {/* BUTTONS */}

            <div className="flex gap-3">

              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "جاري الحفظ..."
                  : editingId
                  ? "حفظ التعديل"
                  : "حفظ الخدمة"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-xl bg-slate-700 px-6 py-3 font-semibold hover:bg-slate-600"
                >
                  إلغاء
                </button>
              )}

            </div>

          </form>
        )}

        {/* SERVICES */}

        <div className="grid gap-5 md:grid-cols-2">

          {services.length === 0 ? (

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:col-span-2">
              <p className="text-slate-400">
                لا توجد خدمات حالياً.
              </p>
            </div>

          ) : (

            services.map((service) => (

              <div
                key={service.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >

                <div className="mb-4 flex items-start justify-between gap-4">

                  <div>
                    <h2 className="text-xl font-bold">
                      {service.name}
                    </h2>

                    {service.description && (
                      <p className="mt-2 text-slate-400">
                        {service.description}
                      </p>
                    )}
                  </div>

                </div>

                <div className="mb-5 flex flex-wrap gap-3">

                  {service.price !== null && (
                    <span className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">
                      السعر:{" "}
                      {Number(
                        service.price
                      ).toLocaleString()}{" "}
                      د.ع
                    </span>
                  )}

                  {service.duration_minutes !== null && (
                    <span className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">
                      المدة:{" "}
                      {service.duration_minutes} دقيقة
                    </span>
                  )}

                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      startEdit(service)
                    }
                    className="flex-1 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold hover:bg-yellow-700"
                  >
                    تعديل
                  </button>

                  <button
                    onClick={() =>
                      deleteService(service.id)
                    }
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
                  >
                    حذف
                  </button>

                </div>

              </div>

            ))

          )}

        </div>

      </div>
    </main>
  );
}
