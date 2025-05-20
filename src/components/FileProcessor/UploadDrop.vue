<template>
  <div
    :class="['upload-container', { 'is-dragover': isDragover }]"
    @dragover.prevent="handleDragover"
    @dragleave.prevent="handleDragleave"
    @drop.prevent="handleDrop"
  >

    <!-- Drag area -->
    <div class="upload-drag-area">
      <i class="el-icon-upload"></i>
      <div class="upload-tip">
        <span>Drop files here, or</span>
        <el-button
          size="small"
          type="primary"
          @click="handleClick">Click to select</el-button>
      </div>
      <div class="upload-hint">{{ hint }}</div>

      <!-- Upload tip slot -->
      <div v-if="$slots.uploadTip" class="upload-tip-slot">
        <slot name="uploadTip"></slot>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      :multiple="multiple"
      :accept="accept"
      class="file-input"
      @change="handleFileChange">

    <!-- File list -->
    <div v-if="showFileList && fileList.length > 0" class="upload-file-list">
      <el-table :data="fileList" style="width: 100%">
        <el-table-column prop="name" label="Filename"></el-table-column>
        <el-table-column prop="size" label="Size">
          <template slot-scope="scope">
            {{ formatFileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column label="Status">
          <template slot-scope="scope">
            <el-progress
              v-if="scope.row.status === 'uploading'"
              :percentage="scope.row.percentage"
              :status="scope.row.percentage === 100 ? 'success' : ''"
            ></el-progress>
            <span v-else-if="scope.row.status === 'success'" class="text-success">
              <i class="el-icon-check"></i> Upload success
            </span>
            <span v-else-if="scope.row.status === 'error'" class="text-danger">
              <i class="el-icon-close"></i> Upload failed
            </span>
            <span v-else-if="scope.row.status === 'ready'" class="text-info">
              <i class="el-icon-document"></i> Ready to upload
            </span>
            <span v-else>{{ scope.row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.status === 'ready' && autoUpload"
              type="primary"
              size="mini"
              @click="upload(scope.row)">
              Upload
            </el-button>
            <el-button
              v-if="scope.row.status !== 'uploading'"
              type="text"
              icon="el-icon-delete"
              @click="removeFile(scope.$index)">
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UploadDrop',
  props: {
    // Allow multiple file upload
    multiple: {
      type: Boolean,
      default: false
    },
    // Accepted file types
    accept: {
      type: String,
      default: ''
    },
    // File size limit (MB)
    fileSize: {
      type: Number,
      default: 10
    },
    // Show uploaded file list
    showFileList: {
      type: Boolean,
      default: true
    },
    // Upload hint text
    hint: {
      type: String,
      default: 'Support single or multiple file upload'
    },
    // Upload request URL (for backward compatibility, not used when autoUpload is false)
    action: {
      type: String,
      default: ''
    },
    // Upload request headers (for backward compatibility)
    headers: {
      type: Object,
      default: () => ({})
    },
    // Additional upload parameters (for backward compatibility)
    data: {
      type: Object,
      default: () => ({})
    },
    // Upload file field name (for backward compatibility)
    name: {
      type: String,
      default: 'file'
    },
    // Auto upload after selection
    autoUpload: {
      type: Boolean,
      default: true
    },
    // Enable before upload check
    beforeUpload: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      isDragover: false,
      fileList: []
    }
  },
  methods: {
    // Handle drag enter
    handleDragover(e) {
      this.isDragover = true
      e.dataTransfer.dropEffect = 'copy'
    },

    // Handle drag leave
    handleDragleave() {
      this.isDragover = false
    },

    // Handle file drop
    handleDrop(e) {
      this.isDragover = false
      const files = e.dataTransfer.files
      if (!files) return
      this.addFiles(files)
    },

    // Handle click to upload
    handleClick() {
      this.$refs.fileInput.click()
    },

    // Handle file selection change
    handleFileChange(e) {
      const files = e.target.files
      if (!files) return
      this.addFiles(files)
      // Reset file input to allow selecting the same file again
      e.target.value = null
    },

    // Add files to the list
    addFiles(files) {
      let postFiles = Array.from(files)

      // Limit to single file if multiple is false
      if (!this.multiple && postFiles.length > 1) {
        postFiles = [postFiles[0]]
        this.$message.warning('Only single file upload is allowed')
      }

      // Check files
      postFiles = postFiles.filter(file => {
        // Execute before upload check
        if (typeof this.beforeUpload === 'function') {
          const result = this.beforeUpload(file)
          if (result === false) {
            return false
          }
        }

        // Check file size
        if (this.fileSize > 0 && file.size > this.fileSize * 1024 * 1024) {
          this.$message.error(`File ${file.name} is too large, cannot exceed ${this.fileSize}MB`)
          return false
        }

        // Check file type if accept is specified
        if (this.accept) {
          const acceptedTypes = this.accept.split(',').map(type => type.trim())
          const fileName = file.name.toLowerCase()
          const isAccepted = acceptedTypes.some(type => {
            if (type.startsWith('.')) {
              return fileName.endsWith(type.toLowerCase())
            }
            return file.type.includes(type)
          })

          if (!isAccepted) {
            this.$message.error(`File ${file.name} type is not supported. Accepted types: ${this.accept}`)
            return false
          }
        }

        return true
      })

      if (postFiles.length === 0) return

      // Clear existing files if not multiple
      if (!this.multiple) {
        this.fileList = []
      }

      // Add to file list
      postFiles.forEach(file => {
        const fileObj = {
          name: file.name,
          size: file.size,
          percentage: 0,
          status: 'ready',
          raw: file
        }
        this.fileList.push(fileObj)

        // If auto upload and action is provided
        if (this.autoUpload && this.action) {
          this.upload(fileObj)
        }
      })

      // Trigger file selection event
      this.$emit('file-change', this.fileList)
    },

    // Upload single file (only used with autoUpload and action)
    upload(file) {
      if (!this.action) {
        this.$message.error('Please set upload URL')
        return
      }

      file.status = 'uploading'

      const formData = new FormData()
      formData.append(this.name, file.raw)

      // Add extra parameters
      if (this.data) {
        Object.keys(this.data).forEach(key => {
          formData.append(key, this.data[key])
        })
      }

      // Create XMLHttpRequest
      const xhr = new XMLHttpRequest()
      xhr.open('POST', this.action, true)

      // Set request headers
      if (this.headers) {
        Object.keys(this.headers).forEach(key => {
          xhr.setRequestHeader(key, this.headers[key])
        })
      }

      // Upload progress
      xhr.upload.addEventListener('progress', e => {
        if (e.total > 0) {
          file.percentage = Math.round((e.loaded * 100) / e.total)
        }
      })

      // Load complete
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          file.status = 'success'
          try {
            const response = JSON.parse(xhr.response)
            this.$emit('success', file, response)
          } catch (e) {
            this.$emit('success', file, xhr.response)
          }
        } else {
          file.status = 'error'
          this.$emit('error', file, xhr.response)
        }
      }

      // Load error
      xhr.onerror = () => {
        file.status = 'error'
        this.$emit('error', file, xhr.response)
      }

      // Send request
      xhr.send(formData)
      this.$emit('start', file)
    },

    // Remove file
    removeFile(index) {
      const file = this.fileList[index]
      this.fileList.splice(index, 1)
      this.$emit('remove', file)

      // Emit file-change event after removal
      this.$emit('file-change', this.fileList)
    },

    // Manually trigger upload for ready files
    submit() {
      const waitingFiles = this.fileList.filter(file => file.status === 'ready')
      waitingFiles.forEach(file => {
        this.upload(file)
      })
    },

    // Clear file list
    clearFiles() {
      this.fileList = []
      this.$emit('file-change', this.fileList)
    },

    // Get files that are ready to upload
    getReadyFiles() {
      return this.fileList.filter(file => file.status === 'ready')
    },

    // Format file size
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B'
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(1) + ' KB'
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.upload-container {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color .3s;

  &:hover {
    border-color: #409EFF;
  }

  &.is-dragover {
    background-color: rgba(32, 159, 255, .06);
    border-color: #409EFF;
  }
}

.upload-drag-area {
  padding: 30px 20px;
  text-align: center;

  .el-icon-upload {
    font-size: 48px;
    color: #c0c4cc;
    margin-bottom: 10px;
  }

  .upload-tip {
    font-size: 14px;
    color: #606266;
    margin-bottom: 10px;
  }

  .upload-hint {
    font-size: 12px;
    color: #909399;
    margin-bottom: 15px;
  }

  .upload-tip-slot {
    margin-top: 15px;
  }
}

.file-input {
  display: none;
}

.upload-file-list {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 15px;

  .text-success {
    color: #67c23a;
  }

  .text-danger {
    color: #f56c6c;
  }

  .text-info {
    color: #909399;
  }
}
</style>
