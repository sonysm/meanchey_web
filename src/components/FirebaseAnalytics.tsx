"use client";

import { useEffect } from "react";
import { app } from "@/lib/firebase";
import { getAnalytics, isSupported } from "firebase/analytics";

export default function FirebaseAnalytics() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      isSupported().then((supported) => {
        if (supported) {
          getAnalytics(app);
        }
      });
    }
  }, []);

  return null;
}
