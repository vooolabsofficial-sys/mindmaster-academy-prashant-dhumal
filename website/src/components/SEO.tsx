import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  schema?: Record<string, any> | Array<Record<string, any>>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = "MindMaster Academy, Prashant Dhumal, Memory Training Pune, Vedic Maths, Superfast Calendar, Brain Training Maharashtra, Satara, Narhe Pune",
  canonical,
  ogType = "website",
  ogImage = "https://mindmasteredu.in/assets/images/memory_seminar_brain_3d.png",
  schema,
}) => {
  const location = useLocation();
  const currentUrl = canonical || `https://mindmasteredu.in${location.pathname === "/" ? "" : location.pathname}`;
  const fullTitle = title.includes("MindMaster")
    ? title
    : `${title} | MindMaster Academy — Prashant Dhumal`;

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle;

    // Helper function to set or create meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Standard Meta Tags
    setMetaTag("name", "description", description);
    setMetaTag("name", "keywords", keywords);
    setMetaTag("name", "author", "Prashant Dhumal Sir");

    // 3. Canonical Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", currentUrl);

    // 4. OpenGraph Tags (Facebook / WhatsApp / LinkedIn previews)
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", currentUrl);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("property", "og:locale", "en_IN");
    setMetaTag("property", "og:site_name", "MindMaster Academy");

    // 5. Twitter Card Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", ogImage);
    setMetaTag("name", "twitter:url", currentUrl);

    // 6. JSON-LD Structured Data for Google Rich Results
    if (schema) {
      const existingScript = document.getElementById("page-dynamic-schema");
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.id = "page-dynamic-schema";
      script.type = "application/ld+json";
      const schemaData = Array.isArray(schema)
        ? { "@context": "https://schema.org", "@graph": schema }
        : { "@context": "https://schema.org", ...schema };
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup dynamic page schema on route change
      const dynamicScript = document.getElementById("page-dynamic-schema");
      if (dynamicScript) {
        dynamicScript.remove();
      }
    };
  }, [fullTitle, description, keywords, currentUrl, ogType, ogImage, schema]);

  return null;
};

export default SEO;
