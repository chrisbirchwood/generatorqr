import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CookieBanner, { useCookieConsent, resetCookieConsent } from "./CookieBanner";
import AnalyticsProvider from "./AnalyticsProvider";

// Mock Vercel Analytics i Speed Insights
vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

vi.mock("@vercel/speed-insights/react", () => ({
  SpeedInsights: () => <div data-testid="vercel-speed-insights" />,
}));

// Komponent pomocniczy do testowania hooka useCookieConsent
function ConsentStatus() {
  const consent = useCookieConsent();
  return <div data-testid="consent-status">{consent ?? "null"}</div>;
}

describe("CookieBanner", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    localStorage.clear();
  });

  it("wyświetla banner gdy brak zapisanej zgody", () => {
    render(<CookieBanner />);
    expect(
      screen.getByText(/korzysta z analityki Vercel/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Akceptuj" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Odrzuć" })).toBeInTheDocument();
  });

  it("nie wyświetla bannera gdy zgoda już zaakceptowana", () => {
    localStorage.setItem("cookie-consent", "accepted");
    render(<CookieBanner />);
    expect(
      screen.queryByText(/korzysta z analityki Vercel/i)
    ).not.toBeInTheDocument();
  });

  it("nie wyświetla bannera gdy zgoda już odrzucona", () => {
    localStorage.setItem("cookie-consent", "rejected");
    render(<CookieBanner />);
    expect(
      screen.queryByText(/korzysta z analityki Vercel/i)
    ).not.toBeInTheDocument();
  });

  it("zapisuje akceptację i ukrywa banner po kliknięciu Akceptuj", async () => {
    render(<CookieBanner />);
    await user.click(screen.getByRole("button", { name: "Akceptuj" }));

    expect(localStorage.getItem("cookie-consent")).toBe("accepted");
    expect(
      screen.queryByText(/korzysta z analityki Vercel/i)
    ).not.toBeInTheDocument();
  });

  it("zapisuje odrzucenie i ukrywa banner po kliknięciu Odrzuć", async () => {
    render(<CookieBanner />);
    await user.click(screen.getByRole("button", { name: "Odrzuć" }));

    expect(localStorage.getItem("cookie-consent")).toBe("rejected");
    expect(
      screen.queryByText(/korzysta z analityki Vercel/i)
    ).not.toBeInTheDocument();
  });

  it("zawiera link do regulaminu", () => {
    render(<CookieBanner />);
    const link = screen.getByText("Więcej informacji");
    expect(link).toHaveAttribute("href", "/regulamin");
  });
});

describe("AnalyticsProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("nie renderuje skryptów analitycznych bez zgody", () => {
    render(<AnalyticsProvider />);
    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("vercel-speed-insights")
    ).not.toBeInTheDocument();
  });

  it("nie renderuje skryptów analitycznych po odrzuceniu", () => {
    localStorage.setItem("cookie-consent", "rejected");
    render(<AnalyticsProvider />);
    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("vercel-speed-insights")
    ).not.toBeInTheDocument();
  });

  it("renderuje skrypty analityczne po akceptacji", () => {
    localStorage.setItem("cookie-consent", "accepted");
    render(<AnalyticsProvider />);
    expect(screen.getByTestId("vercel-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("vercel-speed-insights")).toBeInTheDocument();
  });
});

describe("useCookieConsent + CookieBanner integracja", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    localStorage.clear();
  });

  it("AnalyticsProvider reaguje na akceptację bez przeładowania strony", async () => {
    render(
      <>
        <CookieBanner />
        <AnalyticsProvider />
      </>
    );

    // Przed akceptacją — brak skryptów
    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("vercel-speed-insights")
    ).not.toBeInTheDocument();

    // Kliknięcie Akceptuj
    await user.click(screen.getByRole("button", { name: "Akceptuj" }));

    // Po akceptacji — skrypty się pojawiają
    expect(screen.getByTestId("vercel-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("vercel-speed-insights")).toBeInTheDocument();
  });

  it("AnalyticsProvider nie reaguje na odrzucenie", async () => {
    render(
      <>
        <CookieBanner />
        <AnalyticsProvider />
      </>
    );

    await user.click(screen.getByRole("button", { name: "Odrzuć" }));

    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("vercel-speed-insights")
    ).not.toBeInTheDocument();
  });

  it("useCookieConsent zwraca null gdy brak zgody", () => {
    render(<ConsentStatus />);
    expect(screen.getByTestId("consent-status")).toHaveTextContent("null");
  });

  it("useCookieConsent zwraca 'accepted' z localStorage", () => {
    localStorage.setItem("cookie-consent", "accepted");
    render(<ConsentStatus />);
    expect(screen.getByTestId("consent-status")).toHaveTextContent("accepted");
  });

  it("useCookieConsent zwraca 'rejected' z localStorage", () => {
    localStorage.setItem("cookie-consent", "rejected");
    render(<ConsentStatus />);
    expect(screen.getByTestId("consent-status")).toHaveTextContent("rejected");
  });

  it("useCookieConsent ignoruje nieprawidłowe wartości w localStorage", () => {
    localStorage.setItem("cookie-consent", "maybe");
    render(<ConsentStatus />);
    expect(screen.getByTestId("consent-status")).toHaveTextContent("null");
  });
});

describe("resetCookieConsent", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    localStorage.clear();
  });

  it("resetuje zgodę i ponownie pokazuje banner", async () => {
    localStorage.setItem("cookie-consent", "accepted");
    render(
      <>
        <CookieBanner />
        <AnalyticsProvider />
      </>
    );

    // Skrypty działają, banner ukryty
    expect(screen.getByTestId("vercel-analytics")).toBeInTheDocument();
    expect(
      screen.queryByText(/korzysta z analityki Vercel/i)
    ).not.toBeInTheDocument();

    // Reset zgody
    act(() => {
      resetCookieConsent();
    });

    // Banner się pojawia, skrypty znikają
    expect(
      screen.getByText(/korzysta z analityki Vercel/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("vercel-speed-insights")
    ).not.toBeInTheDocument();
    expect(localStorage.getItem("cookie-consent")).toBeNull();
  });

  it("po resecie i ponownej akceptacji skrypty się ładują", async () => {
    localStorage.setItem("cookie-consent", "accepted");
    render(
      <>
        <CookieBanner />
        <AnalyticsProvider />
      </>
    );

    act(() => {
      resetCookieConsent();
    });

    // Banner widoczny — klikamy Akceptuj ponownie
    await user.click(screen.getByRole("button", { name: "Akceptuj" }));

    expect(screen.getByTestId("vercel-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("vercel-speed-insights")).toBeInTheDocument();
    expect(localStorage.getItem("cookie-consent")).toBe("accepted");
  });

  it("po resecie i odrzuceniu skrypty nie działają", async () => {
    localStorage.setItem("cookie-consent", "accepted");
    render(
      <>
        <CookieBanner />
        <AnalyticsProvider />
      </>
    );

    act(() => {
      resetCookieConsent();
    });

    await user.click(screen.getByRole("button", { name: "Odrzuć" }));

    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("vercel-speed-insights")
    ).not.toBeInTheDocument();
    expect(localStorage.getItem("cookie-consent")).toBe("rejected");
  });
});
