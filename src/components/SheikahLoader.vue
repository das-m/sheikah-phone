<script setup lang="ts">
defineProps({
  show: Boolean
})
</script>

<template>
  <Transition name="glow" :duration="1000">
    <div class="SheikahLoader" v-if="show">
      <div class="SheikahLoader-logo">
        <div class="SheikahLoader-logo-left SheikahLoader-logo-decor"></div>
        <div class="SheikahLoader-logo-main"></div>
        <div class="SheikahLoader-logo-right SheikahLoader-logo-decor"></div>
        <div class="SheikahLoader-logo-glow SheikahLoader-logo-decor"></div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.SheikahLoader {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  z-index: 5 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.5);

  &-logo {
    position: relative;
    aspect-ratio: 1/1;
    width: 80%;
    max-width: 500px;
    filter: brightness(100%) drop-shadow(0);

    &-main,
    &-decor {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: transparent center no-repeat;
      background-size: contain;
      transform: translateX(0);
    }

    &-left {
      background-image: url(@/assets/images/logo/sheikah-decor-left.svg);
    }

    &-main {
      background-image: url(@/assets/images/logo/sheikah-main.svg);
    }

    &-right {
      background-image: url(@/assets/images/logo/sheikah-decor-right.svg);
    }

    &-glow {
      background-image: url(@/assets/images/logo/sheikah-decor-glow.png);
      background-size: 110%;
      opacity: 0;
    }
  }
}

.glow-leave-active,
.glow-enter-active {
  transition: opacity 0.2s ease;

  .SheikahLoader-logo {
    transition:
      opacity 0.2s 1s ease,
      transform 0.5s 1s ease;

    &-main {
      transition:
        opacity 0.4s ease,
        transform 0.5s ease;
    }

    &-left,
    &-right {
      transition: transform 0.4s ease;
    }

    &-glow {
      transition:
        transform 0.5s ease,
        opacity 1s ease;
    }
  }
}

.glow-enter-from {
  .SheikahLoader-logo {
    opacity: 1;
  }
}
.glow-leave-to {
  .SheikahLoader-logo {
    opacity: 0;
    transform: scale(1.5);
  }
}

.glow-enter-from,
.glow-leave-to {
  opacity: 0;

  .SheikahLoader-logo {
    &-left {
      transform: translateX(-100px);
      opacity: 0;
    }

    &-main {
      opacity: 0;
      transform: scale(1.3);
    }

    &-right {
      transform: translateX(100px);
      opacity: 0;
    }

    &-glow {
      transform: scale(130%);
      opacity: 0.5;
    }
  }
}
</style>
