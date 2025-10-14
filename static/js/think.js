// Minimum display time for each step (in milliseconds)
// const MIN_DISPLAY_TIME = 10000; // 10 seconds
const MIN_DISPLAY_TIME = 5000;
// Additional dwell time after the final poem is rendered so visitors can read it
const POEM_POST_DISPLAY_TIME = 6000;
let lastStepTime = 0;

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const mediaUrl = urlParams.get("media_url");
  const origmediaUrl = urlParams.get("original_media_url") || mediaUrl;
  const mediaType = urlParams.get("media_type");

  if (!mediaUrl) {
    alert("No media URL provided");
    return;
  }

  // 页面入场动画
  initPageAnimation();

  // 启动女书雨背景效果
  startNvshuRain();

  // Initialize left panel with media - 保持显示上传的媒体文件
  initializeMediaDisplay(mediaUrl, mediaType);

  // 启动媒体呼吸效果
  startMediaBreathingEffect();

  // Start the process
  describeVideo(origmediaUrl);
});

// 新增函数：移除描述覆盖层，显示原始媒体
function showOriginalMedia() {
  const descriptionOverlay = document.getElementById("description-overlay");
  if (descriptionOverlay) {
    if (typeof gsap !== "undefined") {
      gsap.to(descriptionOverlay, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          descriptionOverlay.remove();
        },
      });
    } else {
      descriptionOverlay.style.opacity = "0";
      setTimeout(() => {
        descriptionOverlay.remove();
      }, 500);
    }
  }
}

// 新增函数：显示描述覆盖层
function showDescriptionOverlay() {
  const descriptionOverlay = document.getElementById("description-overlay");
  if (descriptionOverlay) {
    if (typeof gsap !== "undefined") {
      gsap.fromTo(
        descriptionOverlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    } else {
      descriptionOverlay.style.opacity = "1";
    }
  }
}

// 新增函数：初始化媒体显示
function initializeMediaDisplay(mediaUrl, mediaType) {
  const leftContent = document.getElementById("left-content");

  const createMediaElement = (url, type) => {
    let element;

    // 优先使用传递的媒体类型，否则根据URL判断
    const isVideo =
      type === "video" ||
      (!type &&
        (url.toLowerCase().endsWith(".mp4") ||
          url.toLowerCase().endsWith(".webm")));
    const isImage =
      type === "image" || (!type && /\.(png|jpe?g|gif|bmp)$/i.test(url));

    if (isVideo) {
      element = document.createElement("video");
      element.src = url;
      element.autoplay = true;
      element.loop = true;
      element.muted = true;
      element.playsInline = true;
      element.controls = false; // 隐藏控制条保持美观
    } else if (isImage) {
      element = document.createElement("img");
      element.src = url;
      element.alt = "Uploaded media";
    } else {
      console.error("Unsupported media type:", type, url);
      return null;
    }

    element.className = "w-full h-full object-cover rounded-full";

    // 添加错误处理
    element.onerror = function () {
      console.error("Failed to load media:", url);
      this.style.display = "none";
    };

    return element;
  };

  // 只创建轨道媒体元素，不创建主媒体元素
  const orbitMediaElement = createMediaElement(mediaUrl, mediaType);

  if (!orbitMediaElement) {
    console.error("Failed to create media elements");
    return;
  }

  // 不清空左侧内容区域，保留原有的淡黄色背景

  // 创建轨道媒体节点 - 在边缘转动的媒体圆形
  const orbitContainer = document.createElement("div");
  orbitContainer.className = "media-orbit-container";

  const orbitTrack = document.createElement("div");
  orbitTrack.className = "media-orbit-track";

  const orbitNode = document.createElement("div");
  orbitNode.className = "media-orbit-node";
  orbitNode.appendChild(orbitMediaElement);

  orbitTrack.appendChild(orbitNode);
  orbitContainer.appendChild(orbitTrack);
  leftContent.appendChild(orbitContainer);

  // 存储媒体信息供后续使用
  window.currentMediaInfo = {
    url: mediaUrl,
    type: mediaType,
    element: orbitMediaElement,
  };

  // 添加点击事件，允许用户切换显示原始媒体或描述
  const mediaCircle = document.querySelector(
    '[data-component="media-circle-overlay"]'
  );
  if (mediaCircle) {
    let showingOverlay = false;
    mediaCircle.addEventListener("click", () => {
      const descriptionOverlay = document.getElementById("description-overlay");
      if (descriptionOverlay) {
        if (showingOverlay) {
          // 隐藏覆盖层
          if (typeof gsap !== "undefined") {
            gsap.to(descriptionOverlay, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out",
            });
          } else {
            descriptionOverlay.style.opacity = "0";
          }
          showingOverlay = false;
        } else {
          // 显示覆盖层
          if (typeof gsap !== "undefined") {
            gsap.to(descriptionOverlay, {
              opacity: 1,
              duration: 0.3,
              ease: "power2.out",
            });
          } else {
            descriptionOverlay.style.opacity = "1";
          }
          showingOverlay = true;
        }
      }
    });

    // 添加鼠标悬停提示
    // mediaCircle.title =
    //   "Click to toggle between original media and analysis results";
  }
}

async function typeWriter(element, texts) {
  element.innerHTML = ""; // 清空现有内容

  // 确保 texts 是数组（如果是字符串，转为单元素数组）
  const lines = Array.isArray(texts) ? texts : [String(texts || "")];

  // 逐行处理
  for (const line of lines) {
    const lineElement = document.createElement("div"); // 每行用 div 包裹
    element.appendChild(lineElement);

    // 当前行的打字机效果
    await new Promise((resolve) => {
      let currentIndex = 0;
      function type() {
        if (currentIndex < line.length) {
          lineElement.innerHTML += line.charAt(currentIndex);
          currentIndex++;
          setTimeout(type, 50); // 每个字符间隔 50ms
        } else {
          resolve(); // 当前行完成
        }
      }
      type();
    });
  }
}

async function typeWriterSimultaneously(
  chineseElement,
  englishElement,
  chineseText,
  englishText
) {
  // 清空现有内容
  chineseElement.innerHTML = "";
  englishElement.innerHTML = "";

  // 创建行元素
  const chineseLineElement = document.createElement("div");
  const englishLineElement = document.createElement("div");
  chineseElement.appendChild(chineseLineElement);
  englishElement.appendChild(englishLineElement);

  return new Promise((resolve) => {
    let chineseIndex = 0;
    let englishIndex = 0;
    let completed = 0;

    // 中文打字机效果（较慢）
    function typeChinese() {
      if (chineseIndex < chineseText.length) {
        const char = chineseText.charAt(chineseIndex);
        if (char === "\n") {
          chineseLineElement.innerHTML += "<br />";
        } else {
          chineseLineElement.innerHTML += char;
        }
        chineseIndex++;
        setTimeout(typeChinese, 80); // 中文 80ms 间隔
      } else {
        completed++;
        if (completed === 2) resolve();
      }
    }

    // 英文打字机效果（较快）
    function typeEnglish() {
      if (englishIndex < englishText.length) {
        const char = englishText.charAt(englishIndex);
        if (char === "\n") {
          englishLineElement.innerHTML += "<br />";
        } else {
          englishLineElement.innerHTML += char;
        }
        englishIndex++;
        setTimeout(typeEnglish, 40); // 英文 40ms 间隔
      } else {
        completed++;
        if (completed === 2) resolve();
      }
    }

    // 同时开始两个打字机效果
    typeChinese();
    typeEnglish();
  });
}

// Carousel state management
let statusItems = [];
let currentActiveIndex = 0;

// Text animation for thinking effect
const lettersAndSymbols = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "-",
  "_",
  "+",
  "=",
  ";",
  ":",
  "<",
  ">",
  ",",
];

class StatusTextAnimator {
  constructor(textElement) {
    this.textElement = textElement;
    this.originalText = textElement.textContent;
    this.isAnimating = false;
    this.animationFrames = [];
    this.thinkingInterval = null;
    this.typingTimeout = null;

    // Ensure we always render into a dedicated span so we can append a cursor element
    if (!textElement.dataset.animatorInit) {
      const textSpan = document.createElement("span");
      textSpan.className = "status-text__content";
      textSpan.textContent = this.originalText;

      const cursor = document.createElement("span");
      cursor.className = "typing-cursor";
      cursor.setAttribute("aria-hidden", "true");

      textElement.textContent = "";
      textElement.appendChild(textSpan);
      textElement.appendChild(cursor);

      textElement.dataset.animatorInit = "true";
    }

    this.textSpan =
      textElement.querySelector(".status-text__content") || textElement;
    this.cursorElement = textElement.querySelector(".typing-cursor");

    this.textElement.classList.add("has-typing-cursor");
  }

  startThinkingAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.textElement.classList.add("is-typing");

    if (!this.cursorElement && this.textElement.dataset.animatorInit) {
      this.cursorElement = this.textElement.querySelector(".typing-cursor");
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    const text = this.originalText;
    const minDelay = 45;
    const maxAdditionalDelay = 90;
    let index = 0;

    if (this.textSpan) {
      this.textSpan.textContent = "";
    } else {
      this.textElement.textContent = "";
    }

    const typeNext = () => {
      if (!this.isAnimating) {
        if (this.textSpan) this.textSpan.textContent = this.originalText;
        else this.textElement.textContent = this.originalText;
        this.typingTimeout = null;
        return;
      }

      if (index < text.length) {
        index += 1;
        if (this.textSpan) {
          this.textSpan.textContent = text.slice(0, index);
        } else {
          this.textElement.textContent = text.slice(0, index);
        }
        const nextDelay =
          minDelay + Math.random() * maxAdditionalDelay;
        this.typingTimeout = setTimeout(typeNext, nextDelay);
      } else {
        if (this.textSpan) this.textSpan.textContent = text;
        else this.textElement.textContent = text;
        this.typingTimeout = null;
        this.isAnimating = false;
        this.textElement.classList.remove("is-typing");
      }
    };

    this.typingTimeout = setTimeout(typeNext, 140);
  }

  startContinuousThinking() {
    if (this.thinkingInterval) return;

    const dots = ["", ".", "..", "..."];
    let dotIndex = 0;

    this.textElement.classList.add("is-typing");

    this.thinkingInterval = setInterval(() => {
      if (this.isAnimating) return; // Don't interfere with scramble animation

      const baseText = this.originalText.replace(/\.+$/, ""); // Remove existing dots
      if (this.textSpan) {
        this.textSpan.textContent = baseText + dots[dotIndex];
      } else {
        this.textElement.textContent = baseText + dots[dotIndex];
      }
      dotIndex = (dotIndex + 1) % dots.length;
    }, 500);
  }

  stopAnimation() {
    this.isAnimating = false;
    this.animationFrames.forEach((frameId) => cancelAnimationFrame(frameId));
    this.animationFrames = [];

    this.textElement.classList.remove("is-typing");

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }

    if (this.textSpan) this.textSpan.textContent = this.originalText;
    else this.textElement.textContent = this.originalText;
  }

  updateText(newText) {
    this.originalText = newText;
    if (!this.isAnimating) {
      if (this.textSpan) this.textSpan.textContent = newText;
      else this.textElement.textContent = newText;
    }
  }
}

function addStatusItem(
  text,
  isActive = false,
  isCompleted = false,
  toggleContent = null
) {
  const statusTrack = document.getElementById("statusTrack");
  const statusItem = document.createElement("div");
  const itemIndex = statusItems.length;

  // 简化状态逻辑：只有三种状态 pending, processing, completed
  let statusClass = "pending";
  if (isCompleted) {
    statusClass = "completed";
  } else if (isActive) {
    statusClass = "processing";
  }

  statusItem.className = `status-item ${statusClass}`;
  statusItem.dataset.index = itemIndex;
  const stepNumber = itemIndex + 1;
  const stepLabel = String(stepNumber).padStart(2, "0");
  statusItem.dataset.stepNumber = stepNumber;
  statusItem.setAttribute("aria-current", isActive ? "step" : "false");

  const toggleId = toggleContent ? `toggle-${Date.now()}-${itemIndex}` : null;

  statusItem.innerHTML = `
        <div class="status-icon">${
          isCompleted ? "✓" : isActive ? "" : ""
        }</div>
        <div class="status-item-content">
            <div class="status-text" data-thinking-text>${text}</div>
            ${
              toggleContent
                ? `<button class="status-details-toggle" onclick="showFloatingDetails('${toggleId}')">details</button>`
                : ""
            }
        </div>
    `;

  // Store toggle content for later use
  if (toggleContent) {
    statusItem.dataset.toggleContent = toggleContent;
    statusItem.dataset.toggleId = toggleId;
  }

  const targetOpacity = isActive ? 1 : isCompleted ? 0.6 : 0.24;

  statusTrack.appendChild(statusItem);
  statusItems.push(statusItem);

  // Add text animator for thinking effect
  const textElement = statusItem.querySelector(".status-text");
  const animator = new StatusTextAnimator(textElement);
  statusItem.textAnimator = animator;

  // Start appropriate animation based on status
  if (isActive && !isCompleted) {
    setTimeout(() => {
      animator.startThinkingAnimation();
    }, 500); // Small delay before starting scramble animation
  } else if (!isCompleted && !isActive) {
    // For pending items, start continuous thinking dots
    setTimeout(() => {
      animator.startContinuousThinking();
    }, 1000);
  }

  // Update indicators
  updateStatusIndicators();

  // Update centering class based on number of items
  updateTrackCentering();

  // If this is the active item, scroll to it
  if (isActive) {
    currentActiveIndex = itemIndex;
    setTimeout(() => scrollToStatusItem(itemIndex), 100);
  }

  // 添加进入动画
  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      statusItem,
      { opacity: 0, y: 40, scale: 0.96 },
      {
        opacity: targetOpacity,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.1,
        onComplete: () => {
          setStatusOpacity(statusItem, targetOpacity, false);
          gsap.set(statusItem, { clearProps: "transform" });
        },
      }
    );
  } else {
    setStatusOpacity(statusItem, targetOpacity, false);
  }

  return statusItem;
}

function setStatusOpacity(item, value, animate = true) {
  if (!item) return;
  if (animate && typeof gsap !== "undefined") {
    gsap.to(item, {
      opacity: value,
      duration: 0.45,
      ease: "power2.out",
    });
  } else {
    item.style.opacity = value;
  }
}

function animateStatusIcon(iconEl) {
  if (!iconEl || typeof gsap === "undefined") return;
  gsap.fromTo(
    iconEl,
    { scale: 0.85, transformOrigin: "50% 50%" },
    { scale: 1, duration: 0.45, ease: "back.out(1.8)" }
  );
}

function renderPoemColumns(chineseElement, poemText) {
  if (!chineseElement) return;
  const raw = (poemText || "").trim();
  if (!raw) return;

  const lines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return;

  const columnCount = Math.min(2, lines.length);
  const perColumn = Math.ceil(lines.length / columnCount);
  const columns = [];

  for (let i = 0; i < columnCount; i++) {
    const slice = lines.slice(i * perColumn, (i + 1) * perColumn);
    if (slice.length) {
      columns.push(slice);
    }
  }

  const buildColumns = () => {
    chineseElement.innerHTML = "";
    chineseElement.classList.add("poem-columns");

    columns.forEach((colLines) => {
      const columnEl = document.createElement("div");
      columnEl.className = "poem-column";

      colLines.forEach((line) => {
        const lineEl = document.createElement("span");
        lineEl.className = "poem-line";
        lineEl.textContent = line;
        columnEl.appendChild(lineEl);
      });

      chineseElement.appendChild(columnEl);
    });

    if (typeof gsap !== "undefined") {
      gsap.fromTo(
        chineseElement.querySelectorAll(".poem-column"),
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.12,
        }
      );
    }
  };

  if (typeof gsap !== "undefined") {
    gsap.to(chineseElement, {
      opacity: 0,
      duration: 0.2,
      ease: "power1.in",
      onComplete: () => {
        buildColumns();
        gsap.to(chineseElement, {
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
        });
      },
    });
  } else {
    buildColumns();
  }
}

function updateStatusIndicators() {
  const indicatorsContainer = document.getElementById("statusIndicators");
  const navHint = indicatorsContainer.querySelector(".carousel-nav-hint");

  // Clear existing dots but keep the nav hint
  const existingDots = indicatorsContainer.querySelectorAll(".status-dot");
  existingDots.forEach((dot) => dot.remove());

  statusItems.forEach((item, index) => {
    const dot = document.createElement("div");
    const isCompleted = item.classList.contains("completed");
    const isProcessing = item.classList.contains("processing");
    const isPending = item.classList.contains("pending");

    let dotClass = "status-dot";
    if (isCompleted) dotClass += " completed";
    else if (isProcessing) dotClass += " processing active";
    else if (isPending) dotClass += " pending";

    dot.className = dotClass;
    dot.onclick = () => scrollToStatusItem(index);

    let title = `Step ${index + 1}`;
    if (isCompleted) title += " (Completed)";
    else if (isProcessing) title += " (Processing)";
    else title += " (Pending)";
    dot.title = title;

    // Insert before the nav hint
    if (navHint) {
      indicatorsContainer.insertBefore(dot, navHint);
    } else {
      indicatorsContainer.appendChild(dot);
    }
  });
}

function updateTrackCentering() {
  const statusTrack = document.getElementById("statusTrack");
  if (!statusTrack) return;

  // Center items if there are 3 or fewer status items
  if (statusItems.length <= 3) {
    statusTrack.classList.add("center-items");
  } else {
    statusTrack.classList.remove("center-items");
  }
}

function scrollToStatusItem(index) {
  const statusTrack = document.getElementById("statusTrack");
  const viewport = document.getElementById("statusViewport");
  const targetItem = statusItems[index];

  if (!targetItem || !statusTrack || !viewport) return;

  // Update current active item to processing state
  statusItems.forEach((item, i) => {
    if (i === index) {
      if (item.classList.contains("completed")) {
        item.setAttribute("aria-current", "false");
        setStatusOpacity(item, 0.6);
      } else {
        // Set current item to processing
        item.className = "status-item processing";
        const icon = item.querySelector(".status-icon");
        if (icon) {
        icon.innerHTML = "";
          animateStatusIcon(icon);
        }
        item.setAttribute("aria-current", "step");
        setStatusOpacity(item, 1);
      }
    } else {
      if (
        item.classList.contains("processing") &&
        !item.classList.contains("completed")
      ) {
        item.className = "status-item pending";
        const icon = item.querySelector(".status-icon");
        if (icon) {
          icon.innerHTML = "○";
          animateStatusIcon(icon);
        }
      }
      item.setAttribute("aria-current", "false");
      if (item.classList.contains("completed")) {
        setStatusOpacity(item, 0.6);
      } else if (item.classList.contains("pending")) {
        setStatusOpacity(item, 0.24);
      }
    }
  });

  currentActiveIndex = index;
  updateStatusIndicators();

  // For centered layout, calculate position to center the active item
  const viewportHeight = viewport.offsetHeight;
  const trackHeight = statusTrack.offsetHeight;
  const itemHeight = targetItem.offsetHeight;
  const itemOffsetTop = targetItem.offsetTop;

  // Calculate the position to center the target item in the viewport
  let scrollPosition = 0;

  // If track is smaller than viewport, keep it centered
  if (trackHeight <= viewportHeight) {
    scrollPosition = 0;
  } else {
    // Center the target item in the viewport
    scrollPosition = itemOffsetTop - viewportHeight / 2 + itemHeight / 2;

    // Constrain scroll position to prevent overscrolling
    const maxScroll = trackHeight - viewportHeight;
    scrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));
  }

  // Smooth scroll animation
  if (typeof gsap !== "undefined") {
    gsap.to(statusTrack, {
      y: -scrollPosition,
      duration: 0.8,
      ease: "power2.inOut",
    });
  } else {
    statusTrack.style.transform = `translateY(${-scrollPosition}px)`;
  }
}

// Floating details functionality
function showFloatingDetails(toggleId) {
  // Find the status item with this toggle ID
  const statusItem = statusItems.find(
    (item) => item.dataset.toggleId === toggleId
  );
  if (!statusItem || !statusItem.dataset.toggleContent) return;

  const toggleContent = statusItem.dataset.toggleContent;
  const titleElement = statusItem.querySelector(".status-text");
  const title = titleElement ? titleElement.textContent : "Details";

  // Create overlay
  let overlay = document.getElementById("status-details-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "status-details-overlay";
    overlay.className = "status-details-overlay";
    overlay.onclick = hideFloatingDetails;
    document.body.appendChild(overlay);
  }

  // Create floating details container
  let floatingDetails = document.getElementById("status-details-floating");
  if (!floatingDetails) {
    floatingDetails = document.createElement("div");
    floatingDetails.id = "status-details-floating";
    floatingDetails.className = "status-details-floating";
    document.body.appendChild(floatingDetails);
  }

  // Set content
  floatingDetails.innerHTML = `
        <button class="close-button" onclick="hideFloatingDetails()">×</button>
        <div class="details-title">${title}</div>
        <div class="details-content">${toggleContent}</div>
    `;

  // Show with animation
  overlay.classList.add("visible");
  floatingDetails.classList.add("visible");

  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      floatingDetails,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
  }
}

function hideFloatingDetails() {
  const overlay = document.getElementById("status-details-overlay");
  const floatingDetails = document.getElementById("status-details-floating");

  if (overlay) overlay.classList.remove("visible");
  if (floatingDetails) {
    if (typeof gsap !== "undefined") {
      gsap.to(floatingDetails, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          floatingDetails.classList.remove("visible");
        },
      });
    } else {
      floatingDetails.classList.remove("visible");
    }
  }
}

// Close floating details with Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    hideFloatingDetails();
  }
});

function updateStatusItem(
  item,
  text,
  isCompleted = true,
  toggleContent = null
) {
  const itemIndex = parseInt(item.dataset.index);

  // Stop any ongoing text animation
  if (item.textAnimator) {
    item.textAnimator.stopAnimation();
  }

  // Store toggle content for floating details
  if (toggleContent) {
    item.dataset.toggleContent = toggleContent;
    const toggleId =
      item.dataset.toggleId || `toggle-${Date.now()}-${itemIndex}`;
    item.dataset.toggleId = toggleId;
  }

  // 更新状态和内容
  const statusClass = isCompleted ? "completed" : "processing";
  item.className = `status-item ${statusClass}`;

  const toggleId = item.dataset.toggleId;
  const stepNumber = parseInt(item.dataset.stepNumber || itemIndex + 1, 10);
  const stepLabel = String(stepNumber).padStart(2, "0");
  item.dataset.stepNumber = stepNumber;
  item.setAttribute("aria-current", isCompleted ? "false" : "step");
  setStatusOpacity(item, isCompleted ? 0.6 : 1);

  item.innerHTML = `
        <div class="status-icon">${isCompleted ? "✓" : "◐"}</div>
        <div class="status-item-content">
            <div class="status-step-label">STEP ${stepLabel}</div>
            <div class="status-text" data-thinking-text>${text}</div>
            ${
              toggleContent
                ? `<button class="status-details-toggle" onclick="showFloatingDetails('${toggleId}')">details</button>`
                : ""
            }
        </div>
    `;

  const iconEl = item.querySelector(".status-icon");
  animateStatusIcon(iconEl);

  // Recreate text animator for the new text element
  const textElement = item.querySelector(".status-text");
  const animator = new StatusTextAnimator(textElement);
  item.textAnimator = animator;

  // Add completion animation
  if (isCompleted && typeof gsap !== "undefined" && iconEl) {
    gsap.to(iconEl, {
      scale: 1.2,
      duration: 0.3,
      ease: "back.out(1.7)",
      yoyo: true,
      repeat: 1,
    });
  }

  // Update indicators
  updateStatusIndicators();

  // After showing completion, move to next item after a delay
  if (isCompleted) {
    setTimeout(() => {
      const nextIndex = itemIndex + 1;
      if (nextIndex < statusItems.length) {
        // 激活下一个状态项
        const nextItem = statusItems[nextIndex];
        nextItem.className = "status-item processing";
        const nextIcon = nextItem.querySelector(".status-icon");
        if (nextIcon) {
          nextIcon.innerHTML = "";
          animateStatusIcon(nextIcon);
        }
        nextItem.setAttribute("aria-current", "step");
        setStatusOpacity(nextItem, 1);

        // 启动文本动画
        if (nextItem.textAnimator) {
          nextItem.textAnimator.stopAnimation();
          setTimeout(() => {
            nextItem.textAnimator.startThinkingAnimation();
          }, 200);
        }

        // 滚动到下一个项目
        scrollToStatusItem(nextIndex);

        // 更新指示器
        updateStatusIndicators();
      }
    }, 2000); // 2秒延迟显示成功状态
  }
}

async function describeVideo(mediaUrl) {
  // 预先创建所有状态项
  const analyzingItem = addStatusItem("The agent is seeing...", true);
  addStatusItem("The agent is thinking...", false);
  addStatusItem("The agent is reflecting...", false);

  lastStepTime = Date.now();

  try {
    const response = await fetch("/describe_video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ media_url: mediaUrl }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    // Update the status item with toggleable content
    const toggleContent = `
            <div class="language-section">
                <div class="language-label">Chinese Description</div>
                <div class="description">${data.video_desc}</div>
            </div>
            <div class="language-section">
                <div class="language-label">English Description</div>
                <div class="description">${data.video_desc_eng}</div>
            </div>
        `;
    updateStatusItem(
      analyzingItem,
      "Media analysis completed",
      true,
      toggleContent
    );

    // 2. 展示对媒体内容的描述 - 在中心区域添加描述覆盖层
    const leftContent = document.getElementById("left-content");

    // 创建描述覆盖层 - 只覆盖中心区域，不影响边缘的轨道媒体
    const descriptionOverlay = document.createElement("div");
    descriptionOverlay.id = "description-overlay";
    descriptionOverlay.className =
      "absolute z-20 w-[85%] h-[85%] rounded-full bg-yellow-50 bg-opacity-90 flex-col flex items-center justify-center p-6 text-center";
    descriptionOverlay.style.top = "7.5%";
    descriptionOverlay.style.left = "7.5%";
    descriptionOverlay.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center space-y-4 px-8 py-6 overflow-y-scroll scrollbar-hide">
                <div class="text-gray-800 text-lg font-medium leading-relaxed text-center max-w-[90%]">
                    <div id="chinese-desc" class="description"></div>
                </div>
                <div class="w-12 h-px bg-gray-300 opacity-50"></div>
                <div class="text-gray-600 text-base leading-relaxed text-center max-w-[90%]">
                    <div id="english-desc" class="description"></div>
                </div>
            </div>
        `;

    // 添加覆盖层到媒体圆形容器
    const mediaCircle = document.querySelector(
      '[data-component="media-circle-overlay"]'
    );
    if (mediaCircle) {
      mediaCircle.appendChild(descriptionOverlay);
    } else {
      leftContent.appendChild(descriptionOverlay);
    }

    // Split both descriptions into lines
    const chineseLines = data.video_desc.split("。");
    const englishLines = data.video_desc_eng.split(".");
    const maxLines = Math.max(chineseLines.length, englishLines.length);

    const chineseDesc = document.getElementById("chinese-desc");
    const englishDesc = document.getElementById("english-desc");

    // Display lines simultaneously (Chinese and English at the same time)
    for (let i = 0; i < maxLines; i++) {
      const chineseLine = i < chineseLines.length ? chineseLines[i].trim() : "";
      const englishLine = i < englishLines.length ? englishLines[i].trim() : "";

      if (chineseLine || englishLine) {
        await typeWriterSimultaneously(
          chineseDesc,
          englishDesc,
          chineseLine,
          englishLine
        );
      }
    }

    // Calculate remaining time to reach MIN_DISPLAY_TIME
    const elapsed = Date.now() - lastStepTime;
    const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    // After minimum display time, move to next step
    setTimeout(() => {
      findSimilarPoems(data.video_description || data.video_desc);
    }, remainingTime);
  } catch (error) {
    updateStatusItem(analyzingItem, `Error: ${error.message}`);
    console.error("Error:", error);

    // Show error message to user - 使用覆盖层显示错误
    let descriptionOverlay = document.getElementById("description-overlay");
    if (!descriptionOverlay) {
      const leftContent = document.getElementById("left-content");
      descriptionOverlay = document.createElement("div");
      descriptionOverlay.id = "description-overlay";
      descriptionOverlay.className =
        "absolute z-20 w-[85%] h-[85%] rounded-full bg-red-900 bg-opacity-80 flex items-center justify-center p-6 text-center";
      descriptionOverlay.style.top = "7.5%";
      descriptionOverlay.style.left = "7.5%";

      const mediaCircle = document.querySelector(
        '[data-component="media-circle-overlay"]'
      );
      if (mediaCircle) {
        mediaCircle.appendChild(descriptionOverlay);
      } else {
        leftContent.appendChild(descriptionOverlay);
      }
    }

    descriptionOverlay.innerHTML = `
            <div class="error-message text-white text-lg">
                Failed to analyze media: ${error.message}
            </div>
        `;
  }
}

function formatChinesePoem(text) {
  return text
    .trim()
    .replace(/\n+/g, "") // 删除原始多余换行
    .replace(/，/g, "\n") // 逗号后换行
    .replace(/，/g, "")
    .replace(/。/g, "");
}

async function findSimilarPoems(description) {
  // Find the existing thinking item instead of creating a new one
  const thinkingItem = statusItems.find((item) =>
    item.querySelector(".status-text").textContent.includes("thinking")
  );

  if (thinkingItem) {
    // Activate the existing thinking item
    thinkingItem.className = "status-item processing";
    const thinkingIcon = thinkingItem.querySelector(".status-icon");
    if (thinkingIcon) {
      thinkingIcon.innerHTML = "";
      animateStatusIcon(thinkingIcon);
    }
    thinkingItem.setAttribute("aria-current", "step");
    setStatusOpacity(thinkingItem, 1);
    if (thinkingItem.textAnimator) {
      thinkingItem.textAnimator.startThinkingAnimation();
    }
    scrollToStatusItem(parseInt(thinkingItem.dataset.index));
  }

  lastStepTime = Date.now();

  try {
    const response = await fetch("/find_similar_poems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ video_description: description }),
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Update the status item with toggleable content
    const toggleContent = `
            <div class="language-section">
                <div class="language-label">Chinese Poems</div>
                <div class="poem">${data.similar_poems.join("<br><br>")}</div>
            </div>
            <div class="language-section">
                <div class="language-label">English Translations</div>
                <div class="poem">${data.similar_poems_eng.join(
                  "<br><br>"
                )}</div>
            </div>
        `;
    if (thinkingItem) {
      updateStatusItem(
        thinkingItem,
        "Found similar poems",
        true,
        toggleContent
      );
    }

    // 3. 展示相似诗句 - 更新描述覆盖层内容
    // 找到现有的描述覆盖层并更新内容
    let descriptionOverlay = document.getElementById("description-overlay");
    if (!descriptionOverlay) {
      // 如果没有覆盖层，创建一个
      const leftContent = document.getElementById("left-content");
      descriptionOverlay = document.createElement("div");
      descriptionOverlay.id = "description-overlay";
      descriptionOverlay.className =
        "absolute z-20 w-[85%] h-[85%] rounded-full bg-yellow-50 bg-opacity-90 flex-col flex items-center justify-center p-6 text-center";
      descriptionOverlay.style.top = "7.5%";
      descriptionOverlay.style.left = "7.5%";

      const mediaCircle = document.querySelector(
        '[data-component="media-circle-overlay"]'
      );
      if (mediaCircle) {
        mediaCircle.appendChild(descriptionOverlay);
      } else {
        leftContent.appendChild(descriptionOverlay);
      }
    }

    // 更新覆盖层内容为诗句
    descriptionOverlay.innerHTML = `
            <div class="w-full h-full flex items-center justify-center p-6">
                <div class="text-gray-800 text-sm break-words leading-relaxed overflow-y-scroll scrollbar-hide max-h-full text-center max-w-[85%]">
                    <div id="poems-container" class="poem space-y-3"></div>
                </div>
            </div>
        `;

    const poemsContainer = document.getElementById("poems-container");

    // Create formatted display with all poems and translations
    let formattedContent = "";

    // 方式1：使用原始API数据（当前方式）
    for (let i = 0; i < data.similar_poems.length; i++) {
      const chinesePoem = formatChinesePoem(data.similar_poems[i]);
      const englishPoem = data.similar_poems_eng[i]; //formatEnglishPoem();

      if (chinesePoem || englishPoem) {
        formattedContent += `<div class="text-black text-xl break-words">${chinesePoem}</div><div class="text-black opacity-50 text-sm break-words pt-8 -mt-10">${englishPoem}</div>`;
      }
    }

    // Display all content at once with typewriter effect
    // 将换行符转换为HTML的<br>标签，并直接设置innerHTML
    const htmlContent = formattedContent.replace(/\n/g, "<br>");
    poemsContainer.innerHTML = htmlContent;

    // 注释掉自动跳转到下一步的代码
    // Calculate remaining time to reach MIN_DISPLAY_TIME
    const elapsed = Date.now() - lastStepTime;
    const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    // After minimum display time, move to next step
    setTimeout(() => {
      generatePoem(description, data.similar_poems);
    }, remainingTime);
  } catch (error) {
    updateStatusItem(thinkingItem, `Error: ${error.message}`);
    console.error("Error:", error);
  }
}

// 4. 展示新诗句
async function generatePoem(description, poems) {
  // Find the existing reflecting item instead of creating a new one
  const reflectingItem = statusItems.find((item) =>
    item.querySelector(".status-text").textContent.includes("reflecting")
  );

  if (reflectingItem) {
    // Activate the existing reflecting item
    reflectingItem.className = "status-item processing";
    const reflectingIcon = reflectingItem.querySelector(".status-icon");
    if (reflectingIcon) {
      reflectingIcon.innerHTML = "";
      animateStatusIcon(reflectingIcon);
    }
    reflectingItem.setAttribute("aria-current", "step");
    setStatusOpacity(reflectingItem, 1);
    if (reflectingItem.textAnimator) {
      reflectingItem.textAnimator.startThinkingAnimation();
    }
    scrollToStatusItem(parseInt(reflectingItem.dataset.index));
  }

  lastStepTime = Date.now();

  try {
    const response = await fetch("/generate_poem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_description: description,
        similar_poems: poems,
      }),
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Update the status item with toggleable content
    const toggleContent = `
            <div class="language-section">
                <div class="language-label">Generated Chinese Poem</div>
                <div class="poem">${data.poem}</div>
            </div>
            <div class="language-section">
                <div class="language-label">English Translation</div>
                <div class="poem">${data.poem_eng}</div>
            </div>
        `;
    if (reflectingItem) {
      updateStatusItem(
        reflectingItem,
        "Generated new poem",
        true,
        toggleContent
      );
    }

    // Display both Chinese and English poems with typewriter effect - 使用覆盖层
    let descriptionOverlay = document.getElementById("description-overlay");
    if (!descriptionOverlay) {
      const leftContent = document.getElementById("left-content");
      descriptionOverlay = document.createElement("div");
      descriptionOverlay.id = "description-overlay";
      descriptionOverlay.className =
        "absolute z-20 w-[85%] h-[85%] rounded-full bg-yellow-50 bg-opacity-90 flex-col flex items-center justify-center p-6 text-center";
      descriptionOverlay.style.top = "7.5%";
      descriptionOverlay.style.left = "7.5%";

      const mediaCircle = document.querySelector(
        '[data-component="media-circle-overlay"]'
      );
      if (mediaCircle) {
        mediaCircle.appendChild(descriptionOverlay);
      } else {
        leftContent.appendChild(descriptionOverlay);
      }
    }

    // 更新覆盖层内容为生成的诗句
    descriptionOverlay.innerHTML = `
            <div class="poem-overlay">
                <div class="poem-english-container">
                    <div id="english-poem" class="poem poem-english"></div>
                </div>
                <div class="poem-columns-wrapper">
                    <div id="chinese-poem" class="poem poem-chinese"></div>
                </div>
            </div>
        `;

    // Apply typewriter effect to both poems simultaneously
    const chinesePoem = document.getElementById("chinese-poem");
    const englishPoem = document.getElementById("english-poem");

    // 检查formatChinesePoem的结果
    const formattedPoem = formatChinesePoem(data.poem);

    await typeWriterSimultaneously(
      chinesePoem,
      englishPoem,
      formattedPoem,
      data.poem_eng
    );

    englishPoem.classList.add("poem-english");
    englishPoem.innerHTML = (data.poem_eng || "").replace(/\n/g, "<br />");
    renderPoemColumns(chinesePoem, formattedPoem);
    // Calculate remaining time to reach MIN_DISPLAY_TIME
    const elapsed = Date.now() - lastStepTime;
    const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    // After minimum display time, mark as completed and hold an extra beat
    setTimeout(() => {
      transitionToGuessPage(data.poem);
    }, Math.max(remainingTime, POEM_POST_DISPLAY_TIME));
  } catch (error) {
    updateStatusItem(reflectingItem, `Error: ${error.message}`);
    console.error("Error:", error);
  }
}
// async function replaceWithSimpleEl(poem) {
//     const reflectingItem = addStatusItem("The agent is creating...", true);
//     lastStepTime = Date.now();
//     try {

//         const response = await fetch('/replace_with_created_char', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ poem: poem })
//         });
//         const data = await response.json();

//         if (data.error) {
//             throw new Error(data.error);
//         }

//         // Display both Chinese and English poems with typewriter effect
//         const leftContent = document.getElementById('left-content');
//         leftContent.innerHTML = `
//             <div class="language-section">
//                 <div class="language-label">Chinese Poem:</div>
//                 <div id="chinese-poem" class="poem"></div>
//             </div>
//             <div class="language-section">
//                 <div class="language-label">Poem with Nvshu:</div>
//                 <div id="poem-el" class="poem"></div>
//             </div>
//         `;

//         // Apply typewriter effect to both poems sequentially
//         const chinesePoem = document.getElementById('chinese-poem');
//         const elPoem = document.getElementById('poem-el');

//         await typeWriter(chinesePoem, data.poem_orig);
//         await typeWriter(elPoem, data.poem_in_simple_el);

//         // Calculate remaining time to reach MIN_DISPLAY_TIME
//         const elapsed = Date.now() - lastStepTime;
//         const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);

//         // After minimum display time, mark as completed
//         setTimeout(() => {
//             // 跳转到 guess.html 页面
//             window.location.href = `/guess?poem=${data.poem_orig}`;
//         }, remainingTime);
//     } catch (error) {
//         updateStatusItem(reflectingItem, `Error: ${error.message}`);
//         console.error('Error:', error);
//     }
// }

// ====================== 页面动画效果 ======================

// 页面入场动画
function initPageAnimation() {
  const mainContainer = document.getElementById("mainContainer");
  const leftPanel = document.querySelector('[data-component="left-panel"]');
  const rightPanel = document.querySelector('[data-component="right-panel"]');
  const background = document.querySelector('[data-component="background"]');
  const leftTitle = document.querySelector('[data-component="left-title"]');
  const rightTitle = document.querySelector('[data-component="right-title"]');
  const mediaWrapper = document.querySelector(
    '[data-component="left-media-wrapper"]'
  );

  // 初始设置所有元素为透明/偏移
  if (mainContainer) {
    mainContainer.style.opacity = "0";
    mainContainer.style.transform = "translateY(30px)";
  }

  if (typeof gsap !== "undefined") {
    const tl = gsap.timeline({ delay: 0.3 });

    // 1. 背景淡入（如果存在的话）
    if (background) {
      tl.fromTo(
        background,
        { opacity: 0 },
        { opacity: 0.7, duration: 0.8, ease: "power2.out" }
      );
    }

    // 2. 主容器淡入和上移
    tl.fromTo(
      mainContainer,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
      background ? "-=0.6" : "0"
    )

      // 3. 标题依次出现
      .fromTo(
        leftTitle,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.8"
      )
      .fromTo(
        rightTitle,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.5"
      )

      // 4. 左右面板交错进入
      .fromTo(
        leftPanel,
        { opacity: 0, x: -60, scale: 0.9 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.9,
          ease: "back.out(1.7)",
        },
        "-=0.7"
      )
      .fromTo(
        rightPanel,
        { opacity: 0, x: 60, scale: 0.9 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.9,
          ease: "back.out(1.7)",
        },
        "-=0.6"
      )

      // 5. 媒体容器特殊入场效果
      .fromTo(
        mediaWrapper,
        { opacity: 0, scale: 0.8, rotation: -2 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: "elastic.out(1, 0.6)",
        },
        "-=0.5"
      )

      // 6. 启动持续的微妙动画效果
      .call(() => {
        // 媒体圆形的微妙呼吸效果
        const mediaCircle = document.getElementById("mediaCircle");
        if (mediaCircle) {
          gsap.to(mediaCircle, {
            boxShadow: "0 0 30px rgba(255, 253, 233, 0.2)",
            duration: 3,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
      });
  } else {
    // 降级处理：没有GSAP时的简单显示
    if (background) background.style.opacity = "0.7";
    mainContainer.style.opacity = "1";
    mainContainer.style.transform = "translateY(0)";
    if (leftTitle) {
      leftTitle.style.opacity = "1";
      leftTitle.style.transform = "translateY(0)";
    }
    if (rightTitle) {
      rightTitle.style.opacity = "1";
      rightTitle.style.transform = "translateY(0)";
    }
    if (mediaWrapper) {
      mediaWrapper.style.opacity = "1";
      mediaWrapper.style.transform = "translateY(0) scale(1) rotate(0)";
    }
  }
}

// 媒体呼吸效果
function startMediaBreathingEffect() {
  const mediaCircle = document.getElementById("mediaCircle");

  if (typeof gsap !== "undefined" && mediaCircle) {
    // 呼吸效果动画
    gsap.to(mediaCircle, {
      scale: 1.05,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
    });

    // 轻微的发光效果
    gsap.to(mediaCircle, {
      boxShadow: "0 0 30px rgba(255, 253, 233, 0.4)",
      duration: 3,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
    });
  }
}

// 停止媒体呼吸效果
function stopMediaBreathingEffect() {
  const mediaCircle = document.getElementById("mediaCircle");

  if (typeof gsap !== "undefined" && mediaCircle) {
    gsap.killTweensOf(mediaCircle);
    gsap.to(mediaCircle, {
      scale: 1,
      boxShadow: "none",
      duration: 0.5,
      ease: "power2.out",
    });
  }
}

// 文字区域等待动画
function startTextLoadingAnimation(element) {
  if (typeof gsap !== "undefined" && element) {
    // 添加加载点动画
    element.innerHTML =
      '<div class="loading-dots">Processing<span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span></div>';

    // 点的动画
    gsap.to(".dot-1", {
      opacity: 0.3,
      duration: 0.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
    });
    gsap.to(".dot-2", {
      opacity: 0.3,
      duration: 0.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0.2,
    });
    gsap.to(".dot-3", {
      opacity: 0.3,
      duration: 0.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0.4,
    });
  }
}

// 停止文字加载动画
function stopTextLoadingAnimation() {
  if (typeof gsap !== "undefined") {
    gsap.killTweensOf(".dot-1, .dot-2, .dot-3");
  }
}

// 女书雨效果生成器
function createNvshuRain() {
  const rainContainer = document.querySelector('[data-component="nvshu-rain"]');
  if (!rainContainer) return;

  // 女书字符图片列表（使用实际存在的文件）
  const nvshuChars = [
    "combined_10-0-15_vertical_black_trim.png",
    "combined_10-0-23_vertical_black_trim.png",
    "combined_11-0-23_vertical_black_trim.png",
    "combined_12-6-23_vertical_black_trim.png",
    "combined_13-2-23_vertical_black_trim.png",
    "combined_13-4-23_vertical_black_trim.png",
    "combined_13-9-15_vertical_black_trim.png",
    "combined_14-0-16_vertical_black_trim.png",
    "combined_14-2-11_vertical_black_trim.png",
    "combined_14-8-17_vertical_black_trim.png",
    "combined_15-2-23_vertical_black_trim.png",
    "combined_16-0-16_vertical_black_trim.png",
    "combined_16-3-22_vertical_black_trim.png",
    "combined_16-4-1_vertical_black_trim.png",
    "combined_16-5-21_vertical_black_trim.png",
    "combined_17-0-18_vertical_black_trim.png",
    "combined_17-0-20_vertical_black_trim.png",
    "combined_18-1-14_vertical_black_trim.png",
    "combined_19-0-23_vertical_black_trim.png",
    "combined_19-3-21_vertical_black_trim.png",
    "combined_20-0-21_vertical_black_trim.png",
    "combined_20-8-16_vertical_black_trim.png",
    "combined_20-8-22_vertical_black_trim.png",
    "combined_21-0-16_vertical_black_trim.png",
    "combined_21-1-16_vertical_black_trim.png",
    "combined_21-1-20_vertical_black_trim.png",
    "combined_21-2-14_vertical_black_trim.png",
    "combined_21-8-19_vertical_black_trim.png",
    "combined_22-0-15_vertical_black_trim.png",
    "combined_22-0-9_vertical_black_trim.png",
  ];

  // 生成随机大小的函数 - 为单个字符
  function getRandomSize() {
    // 随机生成20-40px之间的大小，创造大小变化
    return 20 + Math.random() * 20;
  }

  // 生成随机透明度
  function getRandomOpacities() {
    const baseFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2倍
    return {
      head: Math.min(0.8 * baseFactor, 0.9),
      second: Math.min(0.6 * baseFactor, 0.7),
      normal: Math.min(0.5 * baseFactor, 0.6),
      small: Math.min(0.4 * baseFactor, 0.5),
      tiny: Math.min(0.3 * baseFactor, 0.4),
    };
  }

  // 创建女书雨列
  function createRainColumn() {
    const column = document.createElement("div");
    column.className = "nvshu-column";

    // 随机位置
    const leftPosition = Math.random() * 100;
    column.style.left = `${leftPosition}%`;

    // 随机延迟
    const delay = Math.random() * 10;
    column.style.setProperty("--delay", `${delay}s`);

    // 获取这个字符的随机大小和透明度
    const randomSize = getRandomSize();
    const randomOpacity = 0.3 + Math.random() * 0.5; // 0.3-0.8之间的透明度

    // 每列只有一个字符，保持独立
    const charCount = 1;

    for (let i = 0; i < charCount; i++) {
      const img = document.createElement("img");
      img.className = "char-img";
      img.src = `/static/nvshu_images/${
        nvshuChars[Math.floor(Math.random() * nvshuChars.length)]
      }`;
      img.alt = "";

      // 直接设置这个字符的大小和透明度
      img.style.width = `${randomSize}px`;
      img.style.opacity = randomOpacity;

      column.appendChild(img);
    }

    return column;
  }

  // 生成初始雨列（减少数量以适应think页面的沉静氛围）
  const columnCount = Math.floor(window.innerWidth / 120); // 更稀疏的分布

  for (let i = 0; i < columnCount; i++) {
    setTimeout(() => {
      const column = createRainColumn();
      rainContainer.appendChild(column);
    }, i * 200); // 错开创建时间
  }

  // 定期添加新的雨列
  setInterval(() => {
    // 随机决定是否添加新列（70%概率）
    if (Math.random() < 0.7) {
      const column = createRainColumn();
      rainContainer.appendChild(column);

      // 清理过多的列元素
      const columns = rainContainer.querySelectorAll(".nvshu-column");
      if (columns.length > columnCount * 2) {
        columns[0].remove();
      }
    }
  }, 3000); // 每3秒检查一次
}

// 启动女书雨效果
function startNvshuRain() {
  const rainContainer = document.querySelector('[data-component="nvshu-rain"]');
  if (!rainContainer) return;

  // 延迟启动，让页面先加载
  setTimeout(() => {
    createNvshuRain();

    // 淡入女书雨效果
    if (typeof gsap !== "undefined") {
      gsap.to(rainContainer, {
        opacity: 1,
        duration: 2,
        ease: "power2.out",
      });
    } else {
      rainContainer.style.opacity = "1";
    }
  }, 1500);
}

// 过渡到guess页面
function transitionToGuessPage(poem) {
  const mainContainer = document.getElementById("mainContainer");
  const background = document.querySelector('[data-component="background"]');

  // 创建过渡覆盖层
  const transitionOverlay = document.createElement("div");
  transitionOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
    `;

  const transitionText = document.createElement("div");
  transitionText.style.cssText = `
        color: #FFFDE9;
        font-size: 1.8rem;
        text-align: center;
        font-family: var(--font-inknut), serif;
    `;
  transitionText.innerHTML =
    'Entering Language Development...<br><span style="font-size: 1.1rem; opacity: 0.8;">Preparing the guessing game</span>';

  transitionOverlay.appendChild(transitionText);
  document.body.appendChild(transitionOverlay);

  // 停止所有现有的呼吸效果
  stopMediaBreathingEffect();

  // 淡出女书雨效果
  const rainContainer = document.querySelector('[data-component="nvshu-rain"]');

  // 创建淡出和过渡动画
  if (typeof gsap !== "undefined") {
    const tl = gsap.timeline();

    // 淡出主内容和女书雨
    tl.to([mainContainer], {
      opacity: 0,
      scale: 0.95,
      duration: 0.8,
      ease: "power2.inOut",
    })
      .to(
        rainContainer,
        {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
        },
        "-=0.6"
      )
      // 显示过渡覆盖层
      .to(
        transitionOverlay,
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.4"
      )
      // 过渡文字的微妙动画
      .to(
        transitionText,
        {
          scale: 1.05,
          duration: 0.4,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
        },
        "-=0.3"
      )
      // 延迟后跳转
      .call(() => {
        setTimeout(() => {
          window.location.href = `/guess?poem=${encodeURIComponent(poem)}`;
        }, 600);
      });
  } else {
    // 降级处理：没有GSAP时的简单过渡
    mainContainer.style.opacity = "0";
    if (rainContainer) rainContainer.style.opacity = "0";
    transitionOverlay.style.opacity = "1";
    setTimeout(() => {
      window.location.href = `/guess?poem=${encodeURIComponent(poem)}`;
    }, 1000);
  }
}
