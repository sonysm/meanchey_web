import { ImageResponse } from "next/og";

export const size = {
    width: 180,
    height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #22c55e 100%)",
                    color: "white",
                    fontSize: 96,
                    fontWeight: 800,
                    letterSpacing: -8,
                }}
            >
                M
            </div>
        ),
        size,
    );
}
