import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EnquiryForm from "../components/EnquiryForm";

/**
 * Standalone contact / feedback page (form posts to `/api/enquiry` → ERPNext Feedback).
 */
export default function Contact() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f2eb",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <Navbar />
      <main id="contact">
        <EnquiryForm />
      </main>
      <Footer />
    </div>
  );
}
