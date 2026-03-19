"use client";
import { use } from "react";
import RatingPage from "@/components/RatingPage";
export default function Rating({ params }) {
  const { id } = use(params);
  return <RatingPage ticketId={id} />;
}