// chunker.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const raw = fs.readFileSync(path.join(__dirname, "data.JSON"), "utf8");
const data = JSON.parse(raw); // Your data is a single object, not an array
const chunks = [];

const sourceId = data.company.toLowerCase().replace(/\s/g, "_"); // A simple ID for the entire data source
const baseMeta = { source_id: sourceId, docType: null };

// 1. Company Overview
if (data.company && data.tagline && data.brand_quote) {
  chunks.push({
    chunk_id: uuidv4(),
    text: `${data.company} - ${data.tagline}. Brand Quote: "${data.brand_quote}"`,
    metadata: { ...baseMeta, docType: "company_overview" },
  });
}

// 2. Shared Features
if (data.shared_features && data.shared_features.length > 0) {
  chunks.push({
    chunk_id: uuidv4(),
    text: `Shared Features across all ZAKTOMATE services include: ${data.shared_features.join(", ")}.`,
    metadata: { ...baseMeta, docType: "shared_features" },
  });
}

// 3. Components
if (data.components && data.components.length > 0) {
  data.components.forEach((component) => {
    // General component description
    chunks.push({
      chunk_id: uuidv4(),
      text: `${component.name} (${component.type}): ${component.description}.`,
      metadata: { ...baseMeta, docType: `component_${component.type.toLowerCase()}` },
    });

    // Zakbot specific details
    if (component.name === "Zakbot") {
      chunks.push({
        chunk_id: uuidv4(),
        text: `Zakbot details: Endpoint is ${component.endpoint}, UI Theme is ${component.ui_theme}, Accent Color is ${
          component.accent_color
        }. It features: ${component.features.join(", ")}.`,
        metadata: { ...baseMeta, docType: "zakbot_details" },
      });
    }

    // Zakdeck specific details
    if (component.name === "Zakdeck") {
      chunks.push({
        chunk_id: uuidv4(),
        text: `Zakdeck offers the following plans for content generation: ${component.plans.join(", ")}.`,
        metadata: { ...baseMeta, docType: "zakdeck_plans" },
      });
    }

    // OpsMate specific details (Service Tracks)
    if (component.name === "OpsMate" && component.tracks && component.tracks.length > 0) {
      component.tracks.forEach((track) => {
        const featuresText = track.features ? `Features include: ${track.features.join("; ")}.` : "";
        chunks.push({
          chunk_id: uuidv4(),
          text: `OpsMate ${track.name}: Regular price is ${track.price_per_month.regular} per month. Introductory price for the first month is ${track.price_per_month.introductory}. ${featuresText}`,
          metadata: { ...baseMeta, docType: `opsmate_track_${track.name.toLowerCase().replace(/\s/g, "_")}` },
        });
      });
    }
  });
}

fs.writeFileSync("chunks.json", JSON.stringify(chunks, null, 2));
console.log(`✅ Created ${chunks.length} chunks for embedding.`);
