
import { useState, useEffect } from "react";
import {
  X,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

import { createBooking } from "./api";
import "./BookingModal.css";

export default function BookingModal({ service, onClose, user }) {
  const [form, setForm] = useState({
    name: user?.full_name || "",
    phone: user?.phone || "",
    address: "",
    date: "",
    time: "",
    notes: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Keep customer details synced with logged-in user
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.full_name || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await createBooking({
        service_id: service.id,
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        address: form.address.trim(),
        booking_date: form.date,
        booking_time: convertTimeSlot(form.time),
        notes: form.notes.trim() || null,
      });

      setBookingId(response.booking.id);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Booking success screen
  if (submitted) {
    return (
      <div className="booking-overlay" onClick={onClose}>
        <div
          className="booking-modal booking-success"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="booking-close" onClick={onClose}>
            <X size={20} />
          </button>

          <div className="booking-success-icon">
            <CheckCircle2 size={42} />
          </div>

          <h2>Request submitted!</h2>

          <p>
            Your booking request for <strong>{service.name}</strong> has been
            saved successfully.
          </p>

          <p className="booking-success-note">
            Booking ID: <strong>#{bookingId}</strong>
            <br />
            Status: Pending confirmation
          </p>

          <button className="booking-submit" onClick={onClose}>
            Back to service <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-overlay" onClick={onClose}>
      <div
        className="booking-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="booking-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="booking-modal-heading">
          <span className="booking-eyebrow">HUNARWALA BOOKING</span>
          <h2>Book your service</h2>
          <p>Tell us what you need. We'll help you connect locally.</p>
        </div>

        <div className="booking-service-summary">
          <div>
            <span>Selected service</span>
            <strong>{service.name}</strong>
          </div>

          <div className="booking-summary-price">
            {service.base_price != null
              ? `₹${service.base_price}`
              : "Price on request"}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          {/* Customer name */}
          <div className="booking-field">
            <label>
              <User size={15} /> Full name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              maxLength={150}
              readOnly={!!user}
              required
            />

            {user && (
              <small className="booking-autofill-note">
                Filled from your account
              </small>
            )}
          </div>

          {/* Customer phone */}
          <div className="booking-field">
            <label>
              <Phone size={15} /> Phone number
            </label>

            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength={10}
              readOnly={!!user}
              required
            />
          </div>

          {/* Service address */}
          <div className="booking-field">
            <label>
              <MapPin size={15} /> Service address
            </label>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Where do you need the service?"
              rows={2}
              minLength={5}
              required
            />
          </div>

          {/* Date and time */}
          <div className="booking-form-row">
            <div className="booking-field">
              <label>
                <CalendarDays size={15} /> Preferred date
              </label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                min={getTodayDate()}
                required
              />
            </div>

            <div className="booking-field">
              <label>
                <Clock size={15} /> Time slot
              </label>

              <select
                name="time"
                value={form.time}
                onChange={handleChange}
                required
              >
                <option value="">Select slot</option>
                <option value="9 AM – 12 PM">9 AM – 12 PM</option>
                <option value="12 PM – 3 PM">12 PM – 3 PM</option>
                <option value="3 PM – 6 PM">3 PM – 6 PM</option>
                <option value="6 PM – 9 PM">6 PM – 9 PM</option>
              </select>
            </div>
          </div>

          {/* Additional requirements */}
          <div className="booking-field">
            <label>
              <MessageSquare size={15} /> Additional requirements
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Describe your requirements (optional)"
              rows={3}
            />
          </div>

          {error && (
            <div className="booking-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="booking-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={18}
                  className="booking-spinner"
                />
                Saving booking...
              </>
            ) : (
              <>
                Submit booking request
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="booking-form-note">
            Final service pricing will be discussed before confirmation.
          </p>
        </form>
      </div>
    </div>
  );
}

// Today's local date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Convert selected time slot to backend time
function convertTimeSlot(slot) {
  const startHour = slot.startsWith("9 AM")
    ? 9
    : slot.startsWith("12 PM")
    ? 12
    : slot.startsWith("3 PM")
    ? 15
    : 18;

  return `${String(startHour).padStart(2, "0")}:00:00`;
}
