import { useState } from "react";
import { MessageCircle, CalendarCheck } from "lucide-react";
import { WHATSAPP_LINK } from "@/data/categories";
import BookingFormDialog from "./BookingFormDialog";

const FloatingCTA = () => {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
        <button
          onClick={() => setBookingOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 bg-gradient-gold py-3.5 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground"
        >
          <CalendarCheck className="h-4 w-4" />
          Book Now
        </button>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 border-l border-border py-3.5 font-body text-xs font-semibold uppercase tracking-wider text-primary"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </div>

      <BookingFormDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </>
  );
};

export default FloatingCTA;
