import { useState, useEffect } from "react";
import { signupUser, loginUser } from "./api";
import { getServices, getCategories, getServiceBySlug } from "./api";
import {
  Search, MapPin, ArrowRight, Wrench, Sparkles,
  GraduationCap, HeartPulse, Car, Paintbrush, Home,
  ShieldCheck, Sun, Moon, Hammer, Scissors, Leaf,
  Laptop, RefreshCw, Star, Users, Clock, CheckCircle2,
  Zap, ArrowLeft, LoaderCircle
} from "lucide-react";
import MyBookings from "./MyBookings";
import "./App.css";
import "./ServiceDetails.css";
import BookingModal from "./BookingModal";
import "./BookingModal.css";
import AuthModal from "./AuthModal";
const categoryIcons = {
  "home-repairs": Wrench,
  cleaning: Sparkles,
  tutoring: GraduationCap,
  healthcare: HeartPulse,
  drivers: Car,
  painting: Paintbrush,
  carpentry: Hammer,
  beauty: Scissors,
  gardening: Leaf,
  technology: Laptop,
};

const categoryColors = [
  "lavender", "peach", "mint", "blue", "pink", "yellow",
];

function App() {
  const [services, setServices] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
const [authMode, setAuthMode] = useState("login");
const [authUser, setAuthUser] = useState(() => {
  const saved = localStorage.getItem("hunarwala-user");
  return saved ? JSON.parse(saved) : null;
});
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("hunarwala-theme") === "dark";
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategoriesData(data.categories || []);
      } catch (err) {
        console.error("Categories error:", err);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    localStorage.setItem("hunarwala-theme", dark ? "dark" : "light");
  }, [dark]);

  async function fetchServices(
    searchValue = search,
    categoryValue = selectedCategory
  ) {
    setLoading(true);
    setError("");

    try {
      const data = await getServices(searchValue, categoryValue);
      setServices(data.services || []);
    } catch (err) {
      setError(err.message || "Unable to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices("", "");
  }, []);

  function handleSearch() {
    fetchServices(search, selectedCategory);
  }

  function handleCategory(categorySlug) {
    const newCategory =
      selectedCategory === categorySlug ? "" : categorySlug;

    setSelectedCategory(newCategory);
    fetchServices(search, newCategory);
  }

  function resetFilters() {
    setSearch("");
    setSelectedCategory("");
    fetchServices("", "");
  }

  async function openService(service) {
    setSelectedService(service);
    setServiceDetails(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const data = await getServiceBySlug(service.slug);
      setServiceDetails(data.service || data);
    } catch (err) {
      setDetailsError(err.message || "Unable to load service details");
    } finally {
      setDetailsLoading(false);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeService() {
    setSelectedService(null);
    setServiceDetails(null);
    setDetailsError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const currentService = serviceDetails || selectedService;
  const DetailIcon = categoryIcons[currentService?.category_slug] || Wrench;

  return (
    <div className={`app ${dark ? "dark" : "light"}`}>
      {/* NAVBAR */}
      <nav className="navbar">
        <a
          className="logo"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            closeService();
          }}
        >
          <span className="logo-mark">h</span>
          <span>hunarwala<span className="dot">.</span></span>
        </a>

        
<div className="nav-links">
  <a
    href="#services"
    onClick={(e) => {
      if (selectedService || showMyBookings) {
        e.preventDefault();
        closeService();
        setShowMyBookings(false);
      }
    }}
  >
    Explore
  </a>

  {!selectedService && !showMyBookings && (
    <>
      <a href="#how">How it works</a>
      <a href="#professionals">For professionals</a>
    </>
  )}

  {!selectedService && (
    <button
      className="nav-bookings-link"
      onClick={() => {
        closeService();
        setShowMyBookings(true);
      }}
    >
      My Bookings
    </button>
  )}
</div>


       
<div className="nav-actions">
  <button
    className="theme-toggle"
    onClick={() => setDark((prev) => !prev)}
    aria-label="Toggle theme"
    title="Toggle theme"
  >
    {dark ? <Sun size={19} /> : <Moon size={19} />}
  </button>
{authUser ? (
  <div className="auth-user-actions">
    <span className="auth-user-name">
      Hi, {authUser.full_name.split(" ")[0]}
    </span>
    <button
      className="login"
      onClick={() => {
        localStorage.removeItem("hunarwala-user");
        localStorage.removeItem("hunarwala-token");
        setAuthUser(null);
      }}
    >
      Log out
    </button>
  </div>
) : (
  <button className="login" onClick={() => setShowAuth(true)}>
    Log in
  </button>
)}

  {!selectedService && (
    <>
      <button
        className="nav-bookings-link"
        onClick={() => {
          closeService();
          setShowMyBookings(true);
        }}
      >
        My Bookings
      </button>

      {!showMyBookings && (
        <button
          className="join"
          onClick={() =>
            document.getElementById("professionals")?.scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          Become a provider <ArrowRight size={16} />
        </button>
      )}
    </>
  )}
</div>

      </nav>

      {/* SERVICE DETAILS */}
      {showMyBookings ? (
  <MyBookings
  onBack={() => setShowMyBookings(false)}
  user={authUser}
/>
) : selectedService ? (
        <main className="service-details-page">
          <div className="service-details-container">
            <button className="details-back" onClick={closeService}>
              <ArrowLeft size={18} /> Back to Explore
            </button>

            {detailsLoading && (
              <div className="api-message">
                <div className="loading-spinner" />
                Loading service details...
              </div>
            )}

            {detailsError && (
              <div className="api-error">
                <p>{detailsError}</p>
                <button onClick={() => openService(selectedService)}>
                  Try again
                </button>
              </div>
            )}

            {!detailsLoading && !detailsError && currentService && (
              <>
                <div className="details-layout">
                  <div className="details-main">
                    <div className="details-visual">
                      <div className="details-visual-icon">
                        <DetailIcon size={58} strokeWidth={1.5} />
                      </div>
                      <span className="service-badge">
                        {currentService.category}
                      </span>
                    </div>

                    <div className="details-content">
                      <span className="section-label">
                        {currentService.category || "LOCAL SERVICE"}
                      </span>

                      <h1>{currentService.name}</h1>

                      <p className="details-description">
                        {currentService.description ||
                          "Skilled help for your everyday needs."}
                      </p>

                      <div className="details-meta">
                        <span>
                          <MapPin size={17} /> Chhindwara, Madhya Pradesh
                        </span>
                        <span>
                          <ShieldCheck size={17} /> Local service
                        </span>
                      </div>

                      <div className="details-info-card">
                        <h3>About this service</h3>
                        <p>
                          {currentService.description ||
                            "Connect with local professionals who can help you with this service."}
                        </p>
                      </div>

                      <div className="details-info-card">
                        <h3>What to expect</h3>
                        <div className="details-feature">
                          <CheckCircle2 size={18} />
                          Connect with local talent
                        </div>
                        <div className="details-feature">
                          <CheckCircle2 size={18} />
                          Discuss your requirements
                        </div>
                        <div className="details-feature">
                          <CheckCircle2 size={18} />
                          Confirm pricing before work begins
                        </div>
                      </div>
                    </div>
                  </div>

                  <aside className="details-sidebar">
                    <div className="details-booking-card">
                      <span className="section-label">SERVICE PRICE</span>

                      <div className="details-price">
                        {currentService.base_price != null ? (
                          <>
                            <strong>₹{currentService.base_price}</strong>
                            {currentService.price_unit && (
                              <span>/ {currentService.price_unit}</span>
                            )}
                          </>
                        ) : (
                          <strong>Price on request</strong>
                        )}
                      </div>

                      <p className="details-price-note">
                        Final pricing may depend on your requirements.
                      </p>

                      <button
  className="details-book-button"
  onClick={() => setShowBooking(true)}
>
  Book Now <ArrowRight size={18} />
</button>

                      <div className="details-trust">
                        <ShieldCheck size={18} />
                        Discuss details before confirming
                      </div>
                    </div>

                    <div className="details-help-card">
                      <div className="details-help-icon">
                        <Clock size={20} />
                      </div>
                      <div>
                        <strong>Need help?</strong>
                        <p>Explore services and find the right professional.</p>
                      </div>
                    </div>
                  </aside>
                </div>
                {showBooking && (
  <BookingModal
    service={currentService}
    onClose={() => setShowBooking(false)}
    user={authUser}
  />
)}
              </>
            )}
          </div>
        </main>
      ) : (
        <>
          {/* HERO */}
          <section className="hero">
            <div className="hero-content">
              <div className="eyebrow">
                <span className="live-dot" />
                YOUR CITY. YOUR PEOPLE. YOUR SERVICES.
              </div>

              <h1>
                Every skill has
                <br />
                a place to <span>shine.</span>
              </h1>

              <p className="hero-description">
                From fixing a tap to finding a tutor.
                Meet skilled local professionals who make
                everyday life a little easier.
              </p>

              <div className="search-box">
                <div className="search-location">
                  <MapPin size={20} />
                  <div>
                    <small>YOUR LOCATION</small>
                    <strong>Chhindwara, MP</strong>
                  </div>
                </div>

                <div className="search-divider" />

                <div className="search-input-wrap">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="What service do you need?"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                </div>

                <button className="search-btn" onClick={handleSearch}>
                  Find my hunar <ArrowRight size={17} />
                </button>
              </div>

              <div className="trust-line">
                <ShieldCheck size={17} />
                Discover trusted professionals near you
              </div>

              <div className="hero-stats">
                <div>
                  <strong>Local</strong>
                  <span>Skilled professionals</span>
                </div>
                <div className="stat-divider" />
                <div>
                  <strong>Easy</strong>
                  <span>Everyday solutions</span>
                </div>
                <div className="stat-divider" />
                <div>
                  <strong>Hunar</strong>
                  <span>Talents that matter</span>
                </div>
              </div>
            </div>

            <div className="hero-art">
              <div className="hero-blob" />

              <div className="hero-art-main">
                <div className="hero-art-top">
                  <span className="art-spark">✦</span>
                  <span>Made for your neighbourhood</span>
                </div>

                <div className="hero-house">
                  <div className="house-roof" />
                  <div className="house-body">
                    <div className="house-window" />
                    <div className="house-door" />
                  </div>
                </div>

                <div className="hero-art-bottom">
                  <div className="hero-art-icon">
                    <Home size={22} />
                  </div>
                  <div>
                    <strong>Good people. Great work.</strong>
                    <span>Right around the corner.</span>
                  </div>
                  <CheckCircle2 size={20} />
                </div>
              </div>

              <div className="floating-card floating-card-one">
                <div className="floating-icon purple">
                  <Wrench size={20} />
                </div>
                <div>
                  <strong>Home repairs</strong>
                  <span>Help is nearby</span>
                </div>
              </div>

              <div className="floating-card floating-card-two">
                <div className="floating-icon peach">
                  <Sparkles size={20} />
                </div>
                <div>
                  <strong>Everyday help</strong>
                  <span>Made simple ✨</span>
                </div>
              </div>
            </div>
          </section>

          {/* CATEGORIES */}
          <section className="categories" id="services">
            <div className="section-heading">
              <div>
                <span className="section-label">EXPLORE BY CATEGORY</span>
                <h2>
                  Find the right <span>hunar.</span>
                </h2>
                <p>Whatever you need, there's a skill for it.</p>
              </div>

              <button className="view-all" onClick={resetFilters}>
                All categories <ArrowRight size={17} />
              </button>
            </div>

            <div className="category-grid">
              {categoriesData.map((category, index) => {
                const Icon = categoryIcons[category.slug] || Wrench;
                const isSelected = selectedCategory === category.slug;

                return (
                  <button
                    className={`category-card ${isSelected ? "selected" : ""}`}
                    key={category.id}
                    onClick={() => handleCategory(category.slug)}
                  >
                    <div
                      className={`category-icon ${
                        categoryColors[index % categoryColors.length]
                      }`}
                    >
                      <Icon size={24} strokeWidth={1.8} />
                    </div>

                    <strong>{category.name}</strong>

                    <span className="category-explore">
                      Explore <ArrowRight size={15} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SERVICES */}
          <section className="services-section">
            <div className="section-heading">
              <div>
                <span className="section-label">LOCAL TALENT, REAL SKILLS</span>
                <h2>
                  Meet your <span>local experts.</span>
                </h2>
                <p>
                  Find the right people for the little things and big things.
                </p>
              </div>

              <button className="view-all" onClick={resetFilters}>
                <RefreshCw size={15} /> Reset filters
              </button>
            </div>

            {loading && (
              <div className="api-message">
                <div className="loading-spinner" />
                Finding your local experts...
              </div>
            )}

            {error && (
              <div className="api-error">
                <p>{error}</p>
                <button onClick={() => fetchServices()}>Try again</button>
              </div>
            )}

            {!loading && !error && services.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <Search size={28} />
                </div>
                <h3>No services found</h3>
                <p>Try another search or explore all categories.</p>
                <button onClick={resetFilters}>Show all services</button>
              </div>
            )}

            {!loading && !error && services.length > 0 && (
              <div className="service-grid">
                {services.map((service, index) => {
                  const Icon = categoryIcons[service.category_slug] || Wrench;

                  return (
                    <article
                      className="service-card"
                      key={service.id}
                      onClick={() => openService(service)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openService(service);
                        }
                      }}
                    >
                      <div
                        className={`service-visual ${
                          categoryColors[index % categoryColors.length]
                        }`}
                      >
                        <div className="service-visual-icon">
                          <Icon size={36} strokeWidth={1.5} />
                        </div>
                        <span className="service-badge">
                          {service.category}
                        </span>
                        <span className="service-visual-spark">✦</span>
                      </div>

                      <div className="service-card-content">
                        <div className="service-card-top">
                          <span className="service-category">
                            {service.category}
                          </span>
                          <span className="service-rating">
                            <Star size={14} fill="currentColor" /> Local
                          </span>
                        </div>

                        <h3>{service.name}</h3>
                        <p>
                          {service.description ||
                            "Skilled help for your everyday needs."}
                        </p>

                        <div className="service-card-bottom">
                          <div className="service-price">
                            <small>STARTING FROM</small>
                            <strong>
                              {service.base_price != null
                                ? `₹${service.base_price}`
                                : "Price on request"}
                            </strong>
                            {service.base_price != null && service.price_unit && (
                              <span>/ {service.price_unit}</span>
                            )}
                          </div>

                          <button
                            className="service-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              openService(service);
                            }}
                            aria-label={`Explore ${service.name}`}
                          >
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* HOW IT WORKS */}
          <section className="how-section" id="how">
            <div className="how-heading">
              <span className="section-label">SIMPLE AS 1, 2, 3</span>
              <h2>
                Good help is <span>closer than you think.</span>
              </h2>
              <p>Finding the right professional shouldn't be complicated.</p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">01</div>
                <div className="step-icon lavender">
                  <Search size={25} />
                </div>
                <h3>Find your service</h3>
                <p>Search what you need or browse skills by category.</p>
              </div>

              <div className="step-card">
                <div className="step-number">02</div>
                <div className="step-icon peach">
                  <Users size={25} />
                </div>
                <h3>Meet local talent</h3>
                <p>Explore skilled professionals from your neighbourhood.</p>
              </div>

              <div className="step-card">
                <div className="step-number">03</div>
                <div className="step-icon mint">
                  <CheckCircle2 size={25} />
                </div>
                <h3>Get things done</h3>
                <p>Connect with the right person and make life easier.</p>
              </div>
            </div>
          </section>

          {/* PROVIDER CTA */}
          <section className="bottom-banner" id="professionals">
            <div className="banner-decoration">✦</div>
            <div className="banner-content">
              <span>HAVE A SKILL? HAVE A HUNAR?</span>
              <h2>Your talent deserves<br />to be discovered.</h2>
              <p>
                Join Hunarwala and connect with people who need your expertise.
              </p>
            </div>

            <button className="banner-button">
              Join as a professional <ArrowRight size={18} />
            </button>
          </section>

          {/* FOOTER */}
          <footer>
            <a className="logo" href="/">
              <span className="logo-mark">h</span>
              <span>hunarwala<span className="dot">.</span></span>
            </a>

            <p>Har hunar, aapke sheher mein. <span>✦</span></p>

            <div className="footer-note">
              Made with <span>♥</span> for local communities
            </div>
          </footer>
        </>
      )}
     {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLogin={(user) => {
            setAuthUser(user);
            setShowAuth(false);
          }}
        />
      )}
    </div>
  );
}

export default App;