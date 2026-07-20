"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StoredUser = {
  name?: string;
  email?: string;
};

export default function InformationForm() {
  const [userData, setUserData] = useState<StoredUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="mx-auto max-w-md space-y-4">
        <Card className="ring-0!">
          <CardContent className="divide-y p-0">
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground">Tên tài khoản</p>
              <p className="mt-1 text-sm font-medium">
                {userData?.name || "—"}
              </p>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="mt-1 text-sm font-medium">
                {userData?.email || "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
