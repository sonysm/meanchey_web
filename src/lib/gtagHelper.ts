declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const pageview = (GA_MEASUREMENT_ID: string, url: string) => {
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }: any) => {
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
