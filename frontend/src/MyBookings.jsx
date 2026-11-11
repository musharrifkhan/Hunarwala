
import { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  ArrowLeft,
  RefreshCw,
  ClipboardList,
  LockKeyhole,
} from "lucide-react";

import { getMyBookings } from "./api";
import "./MyBookings.css";

export default function MyBookings({ onBack, user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // Securely fetch bookings using JWT
  useEffect(() => {
    if (!user?.id) {
      setBookings([]);
      setSearched(false);
      setError("");
      return;
    }

    let cancelled = false;

    async function loadBookings() {
      setLoading(true);
      setError("");
      setSearched(true);

      try {
        const data = await getMyBookings();

        if (!cancelled) {
          setBookings(data.bookings || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong");
          setBookings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function statusClass(status) {
    return status?.toLowerCase().replace(/\s+/g, "-");
  }

  return (
    <main className="my-bookings-page">
      <div className="my-bookings-container">

        <button className="my-bookings-back" onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Explore
        </button>

        <header className="my-bookings-header">
          <span className="my-bookings-eyebrow">
            YOUR HUNARWALA ACTIVITY
          </span>

          <h1>
            My Bookings<span>.</span>
          </h1>

          <p>Track your service requests and booking details.</p>
        </header>

        {/* Login required */}
        {!user && (
          <div className="my-bookings-empty">
            <LockKeyhole size={42} />
            <h3>Login required</h3>
            <p>Please login to view your bookings securely.</p>
          </div>
        )}

        {/* Loading */}
        {user && loading && (
          <div className="my-bookings-empty">
            <RefreshCw size={30} className="booking-spin" />
            <h3>Loading your bookings...</h3>
            <p>Please wait while we fetch your service requests.</p>
          </div>
        )}

        {/* Error */}
        {user && error && (
          <div className="my-bookings-error">
            {error}
          </div>
        )}

        {/* Empty state */}
        {user && searched && !loading && !error && bookings.length === 0 && (
          <div className="my-bookings-empty">
            <ClipboardList size={42} />
            <h3>No bookings found</h3>
            <p>
              You haven't booked any services yet.
              Explore Hunarwala and book your first service!
            </p>
          </div>
        )}

        {/* Booking results */}
        {user && !loading && bookings.length > 0 && (
          <>
            <div className="my-bookings-results-heading">
              <h2>Your service requests</h2>
              <span>{bookings.length} booking(s)</span>
            </div>

            <div className="my-bookings-list">
              {bookings.map((booking) => (
                <article className="my-booking-card" key={booking.id}>
                  <div className="my-booking-top">
                    <div className="my-booking-service">
                      <span>{booking.category}</span>
                      <h3>{booking.service_name}</h3>
                      <p>Booking #{booking.id}</p>
                    </div>

                    <span
                      className={`my-booking-status ${statusClass(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="my-booking-details">
                    <div>
                      <CalendarDays size={17} />
                      <span>{formatDate(booking.booking_date)}</span>
                    </div>

                    <div>
                      <Clock size={17} />
                      <span>{formatTime(booking.booking_date)}</span>
                    </div>

                    <div>
                      <MapPin size={17} />
                      <span>{booking.address}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="my-booking-notes">
                      <strong>Your requirements</strong>
                      <p>{booking.notes}</p>
                    </div>
                  )}

                  <div className="my-booking-footer">
                    <span>
                      Requested on {formatDate(booking.created_at)}
                    </span>

                    <strong>
                      {booking.base_price != null
                        ? `₹${booking.base_price}`
                        : "Price on request"}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
