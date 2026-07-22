import { ImageResponse } from "next/og";

export const size = {
    width: 512,
    height: 512,
};

export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    //background: "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #22c55e 100%)",
                    //color: "white",
                    fontSize: 248,
                    fontWeight: 800,
                    letterSpacing: -18,
                }}
            >
                M
            </div>
        ),
        size,
    );
}
