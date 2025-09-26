uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_res;
uniform sampler2D u_map;
uniform vec2 u_ratio;
uniform float u_progressHover;
uniform float u_alpha;

varying vec2 v_uv;

float circle(vec2 st, float radius, float blur) {
    return 1. - smoothstep(radius - radius * blur, radius + radius * blur, dot(st, st) * 4.);
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 resolution = u_res;
    float time = u_time * 0.05;
    float progressHover = u_progressHover;
    vec2 uv = v_uv;

    vec2 st = gl_FragCoord.xy / resolution.xy - vec2(.5);
    st.y *= resolution.y / resolution.x;

    vec2 mouse = vec2((u_mouse.x / u_res.x) * 2. - 1.,-(u_mouse.y / u_res.y) * 2. + 1.) * -.5;
    mouse.y *= resolution.y / resolution.x;

    vec2 cpos = st + mouse;

    float grd = 0.1 * progressHover;

    float sqr = 100. * ((smoothstep(0., grd, uv.x) - smoothstep(1. - grd, 1., uv.x)) * (smoothstep(0., grd, uv.y) - smoothstep(1. - grd, 1., uv.y))) - 10.;

    float c = circle(cpos, .04 * progressHover, 2.) * 50.;
    float c2 = circle(cpos, .01 * progressHover, 2.);

    float offX = uv.x + sin(uv.y + time * 2.);
    float offY = uv.y - time * .2 - cos(time * 2.) * 0.1;
    float nc = noise(vec2(offX, offY) * 8.) * progressHover;
    float nh = noise(vec2(offX, offY) * 2.) * .1;

    c2 = smoothstep(.1, .8, c2 * 5. + nc * 3. - 1.);

    uv -= vec2(0.5);
    uv *= 1. - u_progressHover * 0.2;
    uv += mouse * 0.1 * u_progressHover;
    uv *= u_ratio;
    uv += vec2(0.5);

    vec4 image = texture2D(u_map, uv);
    vec4 hover = vec4(1.0, 1.0, 1.0, 1.0); // Simplified hover color

    float finalMask = smoothstep(.0, .1, sqr - c);

    image = mix(image, hover, clamp(c2, 0., 1.));

    gl_FragColor = vec4(image.rgb, u_alpha * finalMask);
}

