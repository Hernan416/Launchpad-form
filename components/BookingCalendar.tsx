"use client";

import Script from "next/script";

const BOOKING_WIDGET_SRC = "https://link.golaunchpad.co/widget/booking/Ckubco8uMV4Y2ALDICUJ";

export function BookingCalendar() {
  return (
    <div className="w-full overflow-hidden rounded-brand-lg bg-white">
      <iframe
        src={BOOKING_WIDGET_SRC}
        style={{ width: "100%", border: "none", overflow: "hidden" }}
        scrolling="no"
        id="launchpad-onboarding-booking-widget"
      />
      <Script src="https://link.golaunchpad.co/js/form_embed.js" strategy="afterInteractive" />
    </div>
  );
}
