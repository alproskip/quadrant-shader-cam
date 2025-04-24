precision mediump float;

uniform vec2 u_resolution;
uniform sampler2D u_texture;
uniform float u_time;
uniform bool u_waveEnabled;
uniform bool u_glitchEnabled;
uniform bool u_zoomEnabled;
uniform bool u_expansionEnabled;
uniform int u_blendMode; // 0: Weighted Average, 1: Max, 2: Additive, 3: Multiply
uniform float u_audioLevel; // 0.0 to 1.0, representing microphone input level

// --- Effect Parameters --- 
uniform float u_waveAmplitude;
uniform float u_waveFrequency;
uniform float u_waveSpeed;
uniform float u_glitchStrength;
uniform float u_glitchSpeed;
uniform float u_zoomBeatFrequency;
uniform float u_zoomBeatSharpness;
uniform float u_zoomBeatAmplitude;
// ------------------------

// Simple pseudo-random function
float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Blend mode functions
vec4 blendWeightedAverage(vec4 accumulated, float totalWeight, vec4 newColor, float newWeight) {
    return (accumulated + newColor * newWeight) / (totalWeight + newWeight);
}

vec4 blendMax(vec4 accumulated, vec4 newColor) {
    return max(accumulated, newColor);
}

vec4 blendAdditive(vec4 accumulated, vec4 newColor, float newWeight) {
    return accumulated + newColor * newWeight;
}

vec4 blendMultiply(vec4 accumulated, vec4 newColor) {
    if (accumulated == vec4(0.0)) return newColor;
    return accumulated * newColor;
}

// Structure to hold blend state
struct BlendState {
    vec4 color;
    float totalWeight;
    int samples;
};

// Function to process blending based on mode
BlendState processBlend(BlendState currentState, vec4 newColor, float weight) {
    BlendState result = currentState;
    result.samples++;

    if (u_blendMode == 0) { // Weighted Average (original)
        result.color = (result.color * result.totalWeight + newColor * weight) / 
                      (result.totalWeight + weight);
        result.totalWeight += weight;
    }
    else if (u_blendMode == 1) { // Max
        result.color = max(result.color, newColor);
        result.totalWeight = 1.0;
    }
    else if (u_blendMode == 2) { // Additive
        result.color += newColor * weight;
        result.totalWeight += weight;
    }
    else if (u_blendMode == 3) { // Multiply
        if (result.samples == 1) result.color = newColor;
        else result.color *= newColor;
        result.totalWeight = 1.0;
    }

    return result;
}

// Function to calculate expansion factor for each quadrant
float getQuadrantExpansion(int quadrant) {
    if (!u_expansionEnabled) return 0.0;  // No expansion when disabled
    float basePhase = u_time * 0.5;
    return pow(abs(sin(basePhase)), 0.7);
}

// Function to get quadrant origin point and expansion direction
vec2 getQuadrantOrigin(int quadrant, float expansion) {
    if (quadrant == 0) return vec2(0.0, 0.0);                    // Bottom Left - fixed at bottom left
    if (quadrant == 1) return vec2(1.0 - expansion, 0.0);       // Bottom Right - moves left
    if (quadrant == 2) return vec2(0.0, 1.0 - expansion);       // Top Left - moves down
    return vec2(1.0 - expansion, 1.0 - expansion);              // Top Right - moves down and left
}

// Function for *QUADRANT-SPECIFIC* effects ONLY
vec4 applyQuadrantSpecificEffects(vec4 inputColor, vec2 quadUv, int quadrant) {
    vec4 outputColor = inputColor;
    if (quadrant == 0) { // Bottom Left
        outputColor.rgb *= vec3(1.0, 0.8, 0.8); // Tint red
    } else if (quadrant == 1) { // Bottom Right
        float gray = dot(outputColor.rgb, vec3(0.299, 0.587, 0.114));
        outputColor.rgb = vec3(gray);
    } else if (quadrant == 2) { // Top Left
        outputColor.rgb = 1.0 - outputColor.rgb; // Invert
    } else if (quadrant == 3) { // Top Right
        vec3 effectColor = vec3(sin(quadUv.x * 10.0 + u_time), cos(quadUv.y * 10.0 + u_time), sin(quadUv.x * quadUv.y * 5.0 + u_time));
        // Blend between original and effect using a sine wave for smooth transition
        float blendFactor = 0.5 + 0.5 * sin(u_time * 0.5); // Varies between 0 and 1
        outputColor.rgb = mix(outputColor.rgb, effectColor, blendFactor * 0.7); // Max 70% effect
    }
    return outputColor;
}

void main() {
    // Get normalized coordinates in [0,2] range
    vec2 rawUv = gl_FragCoord.xy / u_resolution.xy;
    
    if (!u_expansionEnabled) {
        // When expansion is disabled, just show regular quadrants
        int quadrant = int(floor(rawUv.x)) + int(floor(rawUv.y)) * 2;
        vec2 quadUv = fract(rawUv);
        vec2 uvForSampling = quadUv;

        // Apply effects within valid UV range
        if (u_zoomEnabled) {
            float beatPulse = pow(abs(sin(u_time * (u_zoomBeatFrequency * (1.0 + u_audioLevel)) * 0.5)), 
                                u_zoomBeatSharpness);
            float zoomScale = 1.0 + beatPulse * u_zoomBeatAmplitude * (1.0 + u_audioLevel * 2.0);
            vec2 center = vec2(0.5, 0.5);
            uvForSampling = center + (quadUv - center) / zoomScale;
        }

        if (u_waveEnabled) {
            float wave = u_waveAmplitude * sin(uvForSampling.x * u_waveFrequency + u_time * u_waveSpeed);
            uvForSampling.y = fract(uvForSampling.y + wave);
        }

        vec4 baseColor = texture2D(u_texture, uvForSampling);
        vec4 effectColor = baseColor;

        if (u_glitchEnabled) {
            float timeSeed = floor(u_time * (u_glitchSpeed * (1.0 + u_audioLevel * 2.0)));
            float glitchIntensity = u_glitchStrength * (1.0 + u_audioLevel * 3.0);
            float r_offset = (random(vec2(timeSeed, quadUv.y * 0.1)) - 0.5) * 2.0 * glitchIntensity;
            float g_offset = (random(vec2(timeSeed, quadUv.y * 0.2)) - 0.5) * 2.0 * glitchIntensity;
            float b_offset = (random(vec2(timeSeed, quadUv.y * 0.3)) - 0.5) * 2.0 * glitchIntensity;

            float r = texture2D(u_texture, vec2(fract(uvForSampling.x + r_offset), uvForSampling.y)).r;
            float g = texture2D(u_texture, vec2(fract(uvForSampling.x + g_offset), uvForSampling.y)).g;
            float b = texture2D(u_texture, vec2(fract(uvForSampling.x + b_offset), uvForSampling.y)).b;
            
            effectColor = vec4(r, g, b, baseColor.a);
        }

        gl_FragColor = applyQuadrantSpecificEffects(effectColor, quadUv, quadrant);
        return;
    }

    // Initialize blend state
    BlendState blendState;
    blendState.color = vec4(0.0);
    blendState.totalWeight = 0.0;
    blendState.samples = 0;

    // Process each quadrant with expansion
    for(int q = 0; q < 4; q++) {
        float expansion = getQuadrantExpansion(q);
        vec2 origin = getQuadrantOrigin(q, expansion);
        
        // Calculate the size of the expanded quadrant
        float quadSize = 1.0 + expansion * 2.0;
        
        // Calculate the center based on quadrant and expansion
        vec2 quadCenter;
        if (q == 0) quadCenter = origin + vec2(quadSize * 0.5);           // Bottom Left
        else if (q == 1) quadCenter = origin + vec2(quadSize * 0.5);      // Bottom Right
        else if (q == 2) quadCenter = origin + vec2(quadSize * 0.5);      // Top Left
        else quadCenter = origin + vec2(quadSize * 0.5);                   // Top Right
        
        vec2 relativePos = (rawUv - quadCenter) / quadSize;
        vec2 quadUv = relativePos + vec2(0.5, 0.5);
        
        if(quadUv.x >= 0.0 && quadUv.x <= 1.0 && quadUv.y >= 0.0 && quadUv.y <= 1.0) {
            float distFromCenter = length(relativePos);
            float weight = 1.0 - smoothstep(0.0, 1.0, distFromCenter);
            weight *= expansion;
            
            vec2 uvForSampling = quadUv;

            // Apply effects within valid UV range
            if (u_zoomEnabled) {
                float beatPulse = pow(abs(sin(u_time * (u_zoomBeatFrequency * (1.0 + u_audioLevel)) * 0.5)), 
                                    u_zoomBeatSharpness);
                float zoomScale = 1.0 + beatPulse * u_zoomBeatAmplitude * (1.0 + u_audioLevel * 2.0);
                vec2 center = vec2(0.5, 0.5);
                uvForSampling = center + (quadUv - center) / zoomScale;
            }

            if (u_waveEnabled) {
                float wave = u_waveAmplitude * sin(uvForSampling.x * u_waveFrequency + u_time * u_waveSpeed);
                uvForSampling.y = fract(uvForSampling.y + wave);
            }

            vec4 baseColor = texture2D(u_texture, uvForSampling);
            vec4 effectColor = baseColor;

            if (u_glitchEnabled) {
                float timeSeed = floor(u_time * (u_glitchSpeed * (1.0 + u_audioLevel * 2.0)));
                float glitchIntensity = u_glitchStrength * (1.0 + u_audioLevel * 3.0);
                float r_offset = (random(vec2(timeSeed, quadUv.y * 0.1)) - 0.5) * 2.0 * glitchIntensity;
                float g_offset = (random(vec2(timeSeed, quadUv.y * 0.2)) - 0.5) * 2.0 * glitchIntensity;
                float b_offset = (random(vec2(timeSeed, quadUv.y * 0.3)) - 0.5) * 2.0 * glitchIntensity;

                float r = texture2D(u_texture, vec2(fract(uvForSampling.x + r_offset), uvForSampling.y)).r;
                float g = texture2D(u_texture, vec2(fract(uvForSampling.x + g_offset), uvForSampling.y)).g;
                float b = texture2D(u_texture, vec2(fract(uvForSampling.x + b_offset), uvForSampling.y)).b;
                
                effectColor = vec4(r, g, b, baseColor.a);
            }

            vec4 quadrantColor = applyQuadrantSpecificEffects(effectColor, quadUv, q);
            
            // Process blend using the new system
            blendState = processBlend(blendState, quadrantColor, weight);
        }
    }

    // Final color depends on blend mode
    if (u_blendMode == 2) { // Additive needs normalization
        gl_FragColor = blendState.color / max(blendState.totalWeight, 1.0);
    } else {
        gl_FragColor = blendState.color;
    }
}