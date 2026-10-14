import { headers } from "next/headers";
import { isSupportedCountry, type CountryCode as Country } from "libphonenumber-js/min";

/**
 * Vercel sets `x-vercel-ip-country` on every request with the visitor's
 * ISO 3166-1 alpha-2 country code. Falls back to "US" locally and for
 * any unsupported/missing value.
 */
export function getVisitorCountry(): Country {
  const country = headers().get("x-vercel-ip-country");
  if (country && isSupportedCountry(country)) {
    return country;
  }
  return "US";
}
