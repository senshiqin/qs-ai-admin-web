<template>
  <div class="pagination-container">
    <h2>学生名单分页查询</h2>
    
    <!-- 学生数据表格 -->
    <table border="1" cellpadding="10" cellspacing="0">
      <thead>
        <tr>
          <th>学生ID</th>
          <th>学生姓名</th>
        </tr>
      </thead>
      <tbody>
        <!-- 遍历当前页数据渲染 -->
        <tr v-for="student in currentPageData" :key="student.id">
          <td>{{ student.id }}</td>
          <td>{{ student.name }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 分页控制器 -->
    <div class="pagination-bar">
      <!-- 上一页按钮 -->
      <button 
        @click="prevPage" 
        :disabled="currentPage === 1"
      >
        上一页
      </button>

      <!-- 数字页码 -->
      <button 
        v-for="page in totalPages" 
        :key="page"
        @click="goToPage(page)"
        :class="{ active: page === currentPage }"
      >
        {{ page }}
      </button>

      <!-- 下一页按钮 -->
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
      >
        下一页
      </button>

      <!-- 分页信息 -->
      <span class="page-info">
        当前第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StudentPagination',
  data() {
    return {
      // 模拟的学生数据
      students: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
        { id: 3, name: '王五' },
        { id: 4, name: '赵六' },
        { id: 5, name: '周七' },
        { id: 6, name: '吴八' },
        { id: 7, name: '郑九' },
        { id: 8, name: '孙十' },
        { id: 9, name: '陈十一' },
        { id: 10, name: '林十二' },
        { id: 11, name: '黄十三' },
        { id: 12, name: '张十四' },
        { id: 13, name: '李十五' },
        { id: 14, name: '王十六' },
        { id: 15, name: '赵十七' },
        { id: 16, name: '周十八' },
        { id: 17, name: '吴十九' },
        { id: 18, name: '郑二十' },
        { id: 19, name: '孙二一' },
        { id: 20, name: '陈二二' },
        { id: 21, name: '林二三' },
        { id: 22, name: '黄二四' },
        { id: 23, name: '张二五' },
        { id: 24, name: '李二六' },
        { id: 25, name: '王二七' },
        { id: 26, name: '赵二八' },
        { id: 27, name: '周二九' },
        { id: 28, name: '吴三十' },
        { id: 29, name: '郑三一' },
        { id: 30, name: '唐三二' },
        { id: 31, name: '宋三三' },
        { id: 32, name: '刘三四' },
        { id: 33, name: '丁三五' },
        { id: 34, name: '沈三六' },
        { id: 35, name: '韩三七' },
        { id: 36, name: '彭三八' },
        { id: 37, name: '陆三九' },
        { id: 38, name: '倪四十' },
        { id: 39, name: '袁四一' },
        { id: 40, name: '顾四二' },
        { id: 41, name: '孟四三' },
        { id: 42, name: '白四四' },
        { id: 43, name: '萧四五' },
        { id: 44, name: '程四六' },
        { id: 45, name: '曹四七' }
      ],
      // 每页显示10条数据
      pageSize: 10,
      // 当前默认显示第一页
      currentPage: 1
    }
  },
  computed: {
    // 计算总页数：向上取整
    totalPages() {
      return Math.ceil(this.students.length / this.pageSize)
    },
    // 计算当前页需要展示的数据
    currentPageData() {
      // 计算数据起始索引和结束索引
      const start = (this.currentPage - 1) * this.pageSize
      const end = this.currentPage * this.pageSize
      // 切片返回当前页数据
      return this.students.slice(start, end)
    }
  },
  methods: {
    // 上一页
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    // 下一页
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    // 跳转到指定页码
    goToPage(page) {
      // 校验页码合法性
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    }
  }
}
</script>

<style scoped>
.pagination-container {
  width: 600px;
  margin: 30px auto;
  text-align: center;
}

table {
  width: 100%;
  margin: 20px 0;
}

.pagination-bar {
  margin-top: 20px;
}

.pagination-bar button {
  margin: 0 5px;
  padding: 5px 10px;
  cursor: pointer;
}

.pagination-bar button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination-bar button.active {
  background-color: #409eff;
  color: white;
  border: 1px solid #409eff;
}

.page-info {
  margin-left: 15px;
  color: #666;
}
</style>