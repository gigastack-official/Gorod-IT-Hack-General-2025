package ru.gigastack.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record VerifyRequest(
        @NotBlank String cardIdB64,
        @NotBlank String nonceB64,   // 12B (Base64-URL)
        @Positive int doorId,        // uint32 по сути
        @NotBlank String ctrLEB64,   // 8B LE (Base64-URL)
        @NotBlank String tagB64      // 16B (Base64-URL)
) {}
