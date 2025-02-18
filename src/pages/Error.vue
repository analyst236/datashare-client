<script>
import { FontAwesomeLayers } from '@fortawesome/vue-fontawesome'

import { Api } from '@/api'
import VersionNumber from '@/components/VersionNumber'
import utils from '@/mixins/utils'
import settings from '@/utils/settings'

/**
 * This page display error.
 */
export default {
  name: 'Error',
  components: {
    FontAwesomeLayers,
    VersionNumber
  },
  mixins: [utils],
  props: {
    /**
     * An Error object or the error message directly.
     */
    error: {
      type: [String, Error],
      default: null
    },
    /**
     * Title of the error page.
     */
    title: {
      type: String,
      default: null
    },
    /**
     * Description (bellow the title) of the error page.
     */
    description: {
      type: String,
      default: null
    },
    /**
     * HTTP error code (if appliable).
     */
    code: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      username: null
    }
  },
  computed: {
    titleAsString() {
      if (!this.title) {
        return this.error instanceof Error ? this.error.message : this.error
      }
      return this.title
    },
    helpLink() {
      return this.$config.get('helpLink', settings.helpLink)
    },
    faqLink() {
      return this.$config.get('faqLink', settings.faqLink)
    },
    documentationLink() {
      return this.$config.get('documentationLink', settings.documentationLink)
    },
    showHeader() {
      return this.isServer && !!this.username
    },
    logoutLink() {
      return Api.getFullUrl(process.env.VUE_APP_DS_AUTH_SIGNOUT)
    }
  },
  async mounted() {
    this.username = await this.$core.auth.getUsername()
  }
}
</script>

<template>
  <div class="error d-flex flex-column">
    <div v-if="showHeader" class="error__header p-3 text-right">
      <a
        v-b-tooltip.html
        class="btn btn-outline-light btn-sm"
        :href="logoutLink"
        :title="$t('menu.connectedAs', { username })"
      >
        <fa icon="sign-out-alt" fixed-width></fa>
        {{ $t('menu.logout') }}
      </a>
    </div>
    <div class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="error__container container">
        <h1 class="mb-3 error__container__heading">
          <span class="error__container__heading__code mr-3">
            <font-awesome-layers class="fa-sm error__container__heading__code__icon">
              <fa icon="circle"></fa>
              <fa icon="sad-tear" class="text-secondary" transform="shrink-6"></fa>
            </font-awesome-layers>
            <span class="px-2 error__container__heading__code__value">
              {{ code }}
            </span>
          </span>
          {{ titleAsString || $t('error.title') }}
        </h1>
        <p class="error__container__description lead">
          {{ description || $t('error.description') }}
        </p>
        <ul class="error__container__links list-inline text-capitalize">
          <li class="list-inline-item error__container__links__item">
            <a :href="faqLink" target="_blank">
              <fa icon="question" fixed-width class="error__container__links__item__icon mr-1"></fa>
              {{ $t('menu.faq') }}
            </a>
          </li>
          <li class="list-inline-item error__container__links__item">
            <a :href="documentationLink" target="_blank">
              <fa icon="book" fixed-width class="error__container__links__item__icon mr-1"></fa>
              {{ $t('menu.userGuides') }}
            </a>
          </li>
          <li class="list-inline-item error__container__links__item">
            <a :href="helpLink" target="_blank">
              <fa icon="ambulance" fixed-width class="error__container__links__item__icon mr-1"></fa>
              {{ $t('menu.help') }}
            </a>
          </li>
          <li class="list-inline-item error__container__links__item">
            <version-number tooltip-placement="top" class="d-inline"></version-number>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error {
  background: $app-context-sidebar-bg no-repeat right bottom;
  color: $app-context-sidebar-color;
  width: 100%;
  min-height: 100vh;

  &__container {
    margin: $spacer auto;
    text-align: center;

    &__heading {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;

      &__code {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        background: $app-sidebar-bg;
        border-radius: 1em;

        &__icon {
          transform: scale(1.1);
        }

        &__value {
          font-size: 0.6em;

          &:empty {
            display: none;
          }
        }
      }
    }

    &__description {
      margin-bottom: $spacer * 5;
    }

    &__links {
      &__item {
        &:not(:last-of-type):after {
          content: '|';
          margin: 0 $spacer;
          color: $app-sidebar-link-color;
        }

        &,
        a {
          color: $app-sidebar-link-color;
        }
      }
    }
  }
}
</style>
