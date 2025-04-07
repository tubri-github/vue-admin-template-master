<template>
  <div class="navbar">
    <hamburger :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <breadcrumb class="breadcrumb-container" />

    <div class="right-menu">
      <el-dropdown v-if="showStats" trigger="click" class="records-dropdown">
    <span class="el-dropdown-link">
      <i class="el-icon-time" style="margin-right: 4px;" />Recent Records
      <i class="el-icon-caret-bottom records-arrow" />
    </span>
        <el-dropdown-menu slot="dropdown" class="records-dropdown-menu user-dropdown">
          <div class="dropdown-refresh-btn">
            <button @click.stop="recentAdded">
              <i class="el-icon-refresh"></i> Refresh
            </button>
          </div>
          <el-dropdown-item divided></el-dropdown-item>
          <el-timeline class="records-timeline">
            <el-timeline-item
              v-for="record in recentRecords"
              :key="record.id"
              :timestamp="record.timestamp"
              hollow
              type="primary"
              placement="top"
            >
              {{ record.type }} — ID: {{ record.id }}
            </el-timeline-item>
          </el-timeline>
        </el-dropdown-menu>
      </el-dropdown>

      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <svg-icon icon-class="user" class-name="user-avatar" />
          <span class="user-name">{{ name }}</span>
          <i class="el-icon-caret-bottom dropdown-caret" />
        </div>
        <el-dropdown-menu slot="dropdown" class="user-dropdown">
          <router-link to="/">
            <el-dropdown-item>Home</el-dropdown-item>
          </router-link>
          <el-dropdown-item divided @click.native="logout">
            <span style="display:block;">Log Out</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'
import { addNewLocality, recentAdded } from '@/api/table'

export default {
  components: {
    Breadcrumb,
    Hamburger
  },
  data(){
    return{
      showStats: (this.$store.getters.roles.indexOf('admin')!== -1),
      recentRecords:[]
    }
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'name'
    ])
  },
  created() {
    if (this.showStats) {
      this.recentAdded();
    }
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    recentAdded(){
      recentAdded().then((response) =>{
        this.recentRecords = response.data.items
      })
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  }
}
</script>
<style>
.dropdown-refresh-btn button {
  background: none;
  border: none;
  color: #409EFF; /* 使用Element UI的主题色 */
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
}
.dropdown-refresh-btn button:hover {
  background-color: #f5f7fa;
}
.dropdown-refresh-btn i {
  margin-right: 8px; /* 图标和文字之间的间距 */
}
</style>
<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .3s;
    -webkit-tap-highlight-color:transparent;

    &:hover {
      background: rgba(0, 0, 0, .025)
    }
  }

  .breadcrumb-container {
    float: left;
  }
  .records-arrow{
    font-size:12px
  }

  .right-menu {
    float: right;
    height: 100%;
    display: flex;
    align-items: center;

    .records-dropdown {
      margin-right: 20px;
      .el-dropdown-link {
        font-size: 14px;
        color: #606266;
        cursor: pointer;
        display: flex;
        align-items: center;

        &:hover {
          color: #409EFF;
        }
      }

      .records-dropdown-menu {
        padding: 12px;
        border-radius: 6px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        .records-timeline {
          max-width: 300px;
          padding-right: 10px;
        }
      }
    }

    .avatar-container {
      margin-right: 20px;

      .avatar-wrapper {
        display: flex;
        align-items: center;
        cursor: pointer;

        .user-avatar {
          width: 28px;
          height: 28px;
          margin-right: 8px;
        }

        .user-name {
          font-size: 14px;
          color: #606266;
          margin-right: 6px;
        }

        .dropdown-caret {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}
</style>
