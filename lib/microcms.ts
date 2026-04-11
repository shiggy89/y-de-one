import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
  apiKey: process.env.MICROCMS_API_KEY!,
});

export type Notice = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  title: string;
  content: string | { html?: string; [key: string]: unknown };
  category?: {
    id: string;
    name: string;
  };
};

export type Blog = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  title: string;
  content: string | { html?: string; [key: string]: unknown };
  eyecatch?: {
    url: string;
    width: number;
    height: number;
  };
};
