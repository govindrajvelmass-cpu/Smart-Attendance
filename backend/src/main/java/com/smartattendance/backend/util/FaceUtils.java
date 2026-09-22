package com.smartattendance.backend.util;

import java.util.Arrays;

public class FaceUtils {

    public static final double SIMILARITY_THRESHOLD = 0.75;

    public static boolean compareEmbeddings(String enrolledEmbedding, String liveEmbedding) {
        if (enrolledEmbedding == null || liveEmbedding == null) {
            return false;
        }

        double[] v1 = parseVector(enrolledEmbedding);
        double[] v2 = parseVector(liveEmbedding);

        if (v1 == null || v2 == null || v1.length != v2.length || v1.length == 0) {
            // If embeddings are tokens/hashes instead of raw vectors, fallback to exact match
            return enrolledEmbedding.trim().equalsIgnoreCase(liveEmbedding.trim());
        }

        double similarity = cosineSimilarity(v1, v2);
        return similarity >= SIMILARITY_THRESHOLD;
    }

    public static double cosineSimilarity(double[] vectorA, double[] vectorB) {
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private static double[] parseVector(String embeddingStr) {
        try {
            String clean = embeddingStr.trim().replaceAll("[\\[\\]]", "");
            String[] parts = clean.split(",");
            if (parts.length < 2) return null;
            double[] vec = new double[parts.length];
            for (int i = 0; i < parts.length; i++) {
                vec[i] = Double.parseDouble(parts[i].trim());
            }
            return vec;
        } catch (Exception e) {
            return null;
        }
    }
}
