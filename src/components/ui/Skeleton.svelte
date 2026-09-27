<script>
  /** A shimmering placeholder that reserves the space content will occupy, so
   *  nothing jumps when it loads. Generic: size it with CSS or the props. */
  let { width = "100%", height = "100%", radius = "10px", class: cls = "" } = $props();
</script>

<span class={cls} style="width:{width};height:{height};border-radius:{radius}" aria-hidden="true"></span>

<style>
  span {
    display: block;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--muted) 10%, transparent),
      color-mix(in srgb, var(--muted) 20%, transparent),
      color-mix(in srgb, var(--muted) 10%, transparent)
    );
    background-size: 200% 100%;
    animation: skel 1.3s ease-in-out infinite;
  }
  @keyframes skel {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    span { animation: none; }
  }
</style>
