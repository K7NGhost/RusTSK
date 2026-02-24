# tsk_sys.rs Function Reference

This document lists every bindgen-generated function (pub fn) found in src/tsk_sys.rs.

Total functions: 151

## error

### tsk_error_errstr2_concat

- Signature: `pub fn tsk_error_errstr2_concat(format: *const ::std::os::raw::c_char, ...);`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_get

- Signature: `pub fn tsk_error_get() -> *const ::std::os::raw::c_char;`
- What it does: Return a human-readable form of tsk_error_get_errno

### tsk_error_get_errno

- Signature: `pub fn tsk_error_get_errno() -> u32;`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_get_errstr

- Signature: `pub fn tsk_error_get_errstr() -> *mut ::std::os::raw::c_char;`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_get_errstr2

- Signature: `pub fn tsk_error_get_errstr2() -> *mut ::std::os::raw::c_char;`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_get_info

- Signature: `pub fn tsk_error_get_info() -> *mut TSK_ERROR_INFO;`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_print

- Signature: `pub fn tsk_error_print(arg1: *mut FILE);`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_reset

- Signature: `pub fn tsk_error_reset();`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_set_errno

- Signature: `pub fn tsk_error_set_errno(t_errno: u32);`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_set_error_listener

- Signature: `pub fn tsk_error_set_error_listener(listener: TSK_ERROR_LISTENER_CB);`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_set_errstr

- Signature: `pub fn tsk_error_set_errstr(format: *const ::std::os::raw::c_char, ...);`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_set_errstr2

- Signature: `pub fn tsk_error_set_errstr2(format: *const ::std::os::raw::c_char, ...);`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_vset_errstr

- Signature: `pub fn tsk_error_vset_errstr(format: *const ::std::os::raw::c_char, args: va_list);`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_vset_errstr2

- Signature: `pub fn tsk_error_vset_errstr2(format: *const ::std::os::raw::c_char, args: va_list);`
- What it does: Gets or clears thread-local Sleuth Kit error state.

### tsk_error_win32_get_per_thread_

- Signature: `pub fn tsk_error_win32_get_per_thread_( struct_size: ::std::os::raw::c_uint, ) -> *mut ::std::os::raw::c_void;`
- What it does: Gets or clears thread-local Sleuth Kit error state.


## other

### tsk_fprintf

- Signature: `pub fn tsk_fprintf(fd: *mut FILE, msg: *const ::std::os::raw::c_char, ...);`
- What it does: Sleuth Kit exported API function.


## fs

### tsk_fs_attr_read

- Signature: `pub fn tsk_fs_attr_read( a_fs_attr: *const TSK_FS_ATTR, a_offset: TSK_OFF_T, a_buf: *mut ::std::os::raw::c_char, a_len: usize, a_flags: TSK_FS_FILE_READ_FLAG_ENUM, ) -> isize;`
- What it does: Accesses filesystem attribute streams and metadata.

### tsk_fs_attr_run_free

- Signature: `pub fn tsk_fs_attr_run_free(arg1: *mut TSK_FS_ATTR_RUN);`
- What it does: Accesses filesystem attribute streams and metadata.

### tsk_fs_attr_walk

- Signature: `pub fn tsk_fs_attr_walk( a_fs_attr: *const TSK_FS_ATTR, a_flags: TSK_FS_FILE_WALK_FLAG_ENUM, a_action: TSK_FS_FILE_WALK_CB, a_ptr: *mut ::std::os::raw::c_void, ) -> u8;`
- What it does: Accesses filesystem attribute streams and metadata.

### tsk_fs_blkcalc

- Signature: `pub fn tsk_fs_blkcalc( fs: *mut TSK_FS_INFO, flags: TSK_FS_BLKCALC_FLAG_ENUM, cnt: TSK_DADDR_T, ) -> i8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_blkcat

- Signature: `pub fn tsk_fs_blkcat( fs: *mut TSK_FS_INFO, flags: TSK_FS_BLKCAT_FLAG_ENUM, addr: TSK_DADDR_T, read_num_units: TSK_DADDR_T, ) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_blkls

- Signature: `pub fn tsk_fs_blkls( fs: *mut TSK_FS_INFO, lclflags: TSK_FS_BLKLS_FLAG_ENUM, bstart: TSK_DADDR_T, bend: TSK_DADDR_T, flags: TSK_FS_BLOCK_WALK_FLAG_ENUM, ) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_blkstat

- Signature: `pub fn tsk_fs_blkstat(fs: *mut TSK_FS_INFO, addr: TSK_DADDR_T) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_block_free

- Signature: `pub fn tsk_fs_block_free(a_fs_block: *mut TSK_FS_BLOCK);`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_block_get

- Signature: `pub fn tsk_fs_block_get( fs: *mut TSK_FS_INFO, fs_block: *mut TSK_FS_BLOCK, addr: TSK_DADDR_T, ) -> *mut TSK_FS_BLOCK;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_block_get_flag

- Signature: `pub fn tsk_fs_block_get_flag( a_fs: *mut TSK_FS_INFO, a_fs_block: *mut TSK_FS_BLOCK, a_addr: TSK_DADDR_T, a_flags: TSK_FS_BLOCK_FLAG_ENUM, ) -> *mut TSK_FS_BLOCK;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_block_walk

- Signature: `pub fn tsk_fs_block_walk( a_fs: *mut TSK_FS_INFO, a_start_blk: TSK_DADDR_T, a_end_blk: TSK_DADDR_T, a_flags: TSK_FS_BLOCK_WALK_FLAG_ENUM, a_action: TSK_FS_BLOCK_WALK_CB, a_ptr: *mut ::std::os::raw::c_void, ) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_close

- Signature: `pub fn tsk_fs_close(arg1: *mut TSK_FS_INFO);`
- What it does: Closes a filesystem handle.

### tsk_fs_dir_close

- Signature: `pub fn tsk_fs_dir_close(arg1: *mut TSK_FS_DIR);`
- What it does: Opens, traverses, and queries filesystem directories.

### tsk_fs_dir_get

- Signature: `pub fn tsk_fs_dir_get(arg1: *const TSK_FS_DIR, arg2: usize) -> *mut TSK_FS_FILE;`
- What it does: Opens, traverses, and queries filesystem directories.

### tsk_fs_dir_get_name

- Signature: `pub fn tsk_fs_dir_get_name(a_fs_dir: *const TSK_FS_DIR, a_idx: usize) -> *const TSK_FS_NAME;`
- What it does: Opens, traverses, and queries filesystem directories.

### tsk_fs_dir_get2

- Signature: `pub fn tsk_fs_dir_get2( arg1: *const TSK_FS_DIR, arg2: usize, load_attributes: usize, ) -> *mut TSK_FS_FILE;`
- What it does: Opens, traverses, and queries filesystem directories.

### tsk_fs_dir_getsize

- Signature: `pub fn tsk_fs_dir_getsize(arg1: *const TSK_FS_DIR) -> usize;`
- What it does: Opens, traverses, and queries filesystem directories.

### tsk_fs_dir_open

- Signature: `pub fn tsk_fs_dir_open( a_fs: *mut TSK_FS_INFO, a_dir: *const ::std::os::raw::c_char, ) -> *mut TSK_FS_DIR;`
- What it does: Opens, traverses, and queries filesystem directories.

### tsk_fs_dir_open_meta

- Signature: `pub fn tsk_fs_dir_open_meta(a_fs: *mut TSK_FS_INFO, a_addr: TSK_INUM_T) -> *mut TSK_FS_DIR;`
- What it does: Opens, traverses, and queries filesystem directories.

### tsk_fs_dir_walk

- Signature: `pub fn tsk_fs_dir_walk( a_fs: *mut TSK_FS_INFO, a_inode: TSK_INUM_T, a_flags: TSK_FS_DIR_WALK_FLAG_ENUM, a_action: TSK_FS_DIR_WALK_CB, a_ptr: *mut ::std::os::raw::c_void, ) -> u8;`
- What it does: Opens, traverses, and queries filesystem directories.

### tsk_fs_ffind

- Signature: `pub fn tsk_fs_ffind( fs: *mut TSK_FS_INFO, lclflags: TSK_FS_FFIND_FLAG_ENUM, inode: TSK_INUM_T, type_: TSK_FS_ATTR_TYPE_ENUM, type_used: u8, id: u16, id_used: u8, flags: TSK_FS_DIR_WALK_FLAG_ENUM, ) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_file_attr_get

- Signature: `pub fn tsk_fs_file_attr_get(a_fs_file: *mut TSK_FS_FILE) -> *const TSK_FS_ATTR;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_attr_get_id

- Signature: `pub fn tsk_fs_file_attr_get_id(a_fs_file: *mut TSK_FS_FILE, arg1: u16) -> *const TSK_FS_ATTR;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_attr_get_idx

- Signature: `pub fn tsk_fs_file_attr_get_idx( a_fs_file: *mut TSK_FS_FILE, a_idx: ::std::os::raw::c_int, ) -> *const TSK_FS_ATTR;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_attr_get_type

- Signature: `pub fn tsk_fs_file_attr_get_type( a_fs_file: *mut TSK_FS_FILE, arg1: TSK_FS_ATTR_TYPE_ENUM, arg2: u16, arg3: u8, ) -> *const TSK_FS_ATTR;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_attr_getsize

- Signature: `pub fn tsk_fs_file_attr_getsize(a_fs_file: *mut TSK_FS_FILE) -> ::std::os::raw::c_int;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_close

- Signature: `pub fn tsk_fs_file_close(a_fs_file: *mut TSK_FS_FILE);`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_get_owner_sid

- Signature: `pub fn tsk_fs_file_get_owner_sid( arg1: *mut TSK_FS_FILE, arg2: *mut *mut ::std::os::raw::c_char, ) -> u8;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_hash_calc

- Signature: `pub fn tsk_fs_file_hash_calc( arg1: *mut TSK_FS_FILE, arg2: *mut TSK_FS_HASH_RESULTS, arg3: TSK_BASE_HASH_ENUM, ) -> u8;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_open

- Signature: `pub fn tsk_fs_file_open( a_fs: *mut TSK_FS_INFO, a_fs_file: *mut TSK_FS_FILE, a_path: *const ::std::os::raw::c_char, ) -> *mut TSK_FS_FILE;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_open_meta

- Signature: `pub fn tsk_fs_file_open_meta( fs: *mut TSK_FS_INFO, fs_file: *mut TSK_FS_FILE, addr: TSK_INUM_T, ) -> *mut TSK_FS_FILE;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_read

- Signature: `pub fn tsk_fs_file_read( arg1: *mut TSK_FS_FILE, arg2: TSK_OFF_T, arg3: *mut ::std::os::raw::c_char, arg4: usize, arg5: TSK_FS_FILE_READ_FLAG_ENUM, ) -> isize;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_read_type

- Signature: `pub fn tsk_fs_file_read_type( arg1: *mut TSK_FS_FILE, arg2: TSK_FS_ATTR_TYPE_ENUM, arg3: u16, arg4: TSK_OFF_T, arg5: *mut ::std::os::raw::c_char, arg6: usize, arg7: TSK_FS_FILE_READ_FLAG_ENUM, ) -> isize;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_walk

- Signature: `pub fn tsk_fs_file_walk( a_fs_file: *mut TSK_FS_FILE, a_flags: TSK_FS_FILE_WALK_FLAG_ENUM, a_action: TSK_FS_FILE_WALK_CB, a_ptr: *mut ::std::os::raw::c_void, ) -> u8;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_file_walk_type

- Signature: `pub fn tsk_fs_file_walk_type( a_fs_file: *mut TSK_FS_FILE, a_type: TSK_FS_ATTR_TYPE_ENUM, a_id: u16, a_flags: TSK_FS_FILE_WALK_FLAG_ENUM, a_action: TSK_FS_FILE_WALK_CB, a_ptr: *mut ::std::os::raw::c_void, ) -> u8;`
- What it does: Opens, reads, and queries filesystem file objects.

### tsk_fs_fls

- Signature: `pub fn tsk_fs_fls( fs: *mut TSK_FS_INFO, lclflags: TSK_FS_FLS_FLAG_ENUM, inode: TSK_INUM_T, flags: TSK_FS_DIR_WALK_FLAG_ENUM, pre: *const TSK_TCHAR, skew: i32, ) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_get_encryption_description

- Signature: `pub fn tsk_fs_get_encryption_description( a_fs_info: *mut TSK_FS_INFO, a_desc: *mut ::std::os::raw::c_char, a_descLen: usize, );`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_icat

- Signature: `pub fn tsk_fs_icat( fs: *mut TSK_FS_INFO, inum: TSK_INUM_T, type_: TSK_FS_ATTR_TYPE_ENUM, type_used: u8, id: u16, id_used: u8, flags: TSK_FS_FILE_WALK_FLAG_ENUM, ) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_ifind_data

- Signature: `pub fn tsk_fs_ifind_data( fs: *mut TSK_FS_INFO, flags: TSK_FS_IFIND_FLAG_ENUM, blk: TSK_DADDR_T, ) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_ifind_par

- Signature: `pub fn tsk_fs_ifind_par( fs: *mut TSK_FS_INFO, flags: TSK_FS_IFIND_FLAG_ENUM, par: TSK_INUM_T, ) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_ifind_path

- Signature: `pub fn tsk_fs_ifind_path( fs: *mut TSK_FS_INFO, path: *mut TSK_TCHAR, result: *mut TSK_INUM_T, ) -> i8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_ils

- Signature: `pub fn tsk_fs_ils( fs: *mut TSK_FS_INFO, lclflags: TSK_FS_ILS_FLAG_ENUM, istart: TSK_INUM_T, ilast: TSK_INUM_T, flags: TSK_FS_META_FLAG_ENUM, skew: i32, img: *const TSK_TCHAR, ) -> u8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_meta_make_ls

- Signature: `pub fn tsk_fs_meta_make_ls( a_fs_meta: *const TSK_FS_META, a_buf: *mut ::std::os::raw::c_char, a_len: usize, ) -> u8;`
- What it does: Retrieves or formats file metadata / inode information.

### tsk_fs_meta_walk

- Signature: `pub fn tsk_fs_meta_walk( a_fs: *mut TSK_FS_INFO, a_start: TSK_INUM_T, a_end: TSK_INUM_T, a_flags: TSK_FS_META_FLAG_ENUM, a_cb: TSK_FS_META_WALK_CB, a_ptr: *mut ::std::os::raw::c_void, ) -> u8;`
- What it does: Retrieves or formats file metadata / inode information.

### tsk_fs_open_img

- Signature: `pub fn tsk_fs_open_img( arg1: *mut TSK_IMG_INFO, arg2: TSK_OFF_T, arg3: TSK_FS_TYPE_ENUM, ) -> *mut TSK_FS_INFO;`
- What it does: Opens a filesystem from an image, pool, or offset.

### tsk_fs_open_img_decrypt

- Signature: `pub fn tsk_fs_open_img_decrypt( arg1: *mut TSK_IMG_INFO, arg2: TSK_OFF_T, arg3: TSK_FS_TYPE_ENUM, password: *const ::std::os::raw::c_char, ) -> *mut TSK_FS_INFO;`
- What it does: Opens a filesystem from an image, pool, or offset.

### tsk_fs_open_pool

- Signature: `pub fn tsk_fs_open_pool( arg1: *const TSK_POOL_INFO, arg2: TSK_DADDR_T, arg3: TSK_FS_TYPE_ENUM, ) -> *mut TSK_FS_INFO;`
- What it does: Opens a filesystem from an image, pool, or offset.

### tsk_fs_open_pool_decrypt

- Signature: `pub fn tsk_fs_open_pool_decrypt( arg1: *const TSK_POOL_INFO, arg2: TSK_DADDR_T, arg3: TSK_FS_TYPE_ENUM, password: *const ::std::os::raw::c_char, ) -> *mut TSK_FS_INFO;`
- What it does: Opens a filesystem from an image, pool, or offset.

### tsk_fs_open_vol

- Signature: `pub fn tsk_fs_open_vol( arg1: *const TSK_VS_PART_INFO, arg2: TSK_FS_TYPE_ENUM, ) -> *mut TSK_FS_INFO;`
- What it does: Opens a filesystem from an image, pool, or offset.

### tsk_fs_open_vol_decrypt

- Signature: `pub fn tsk_fs_open_vol_decrypt( arg1: *const TSK_VS_PART_INFO, arg2: TSK_FS_TYPE_ENUM, password: *const ::std::os::raw::c_char, ) -> *mut TSK_FS_INFO;`
- What it does: Opens a filesystem from an image, pool, or offset.

### tsk_fs_parse_inum

- Signature: `pub fn tsk_fs_parse_inum( str_: *const TSK_TCHAR, arg1: *mut TSK_INUM_T, arg2: *mut TSK_FS_ATTR_TYPE_ENUM, arg3: *mut u8, arg4: *mut u16, arg5: *mut u8, ) -> ::std::os::raw::c_int;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_path2inum

- Signature: `pub fn tsk_fs_path2inum( a_fs: *mut TSK_FS_INFO, a_path: *const ::std::os::raw::c_char, a_result: *mut TSK_INUM_T, a_fs_name: *mut TSK_FS_NAME, ) -> i8;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_read

- Signature: `pub fn tsk_fs_read( a_fs: *mut TSK_FS_INFO, a_off: TSK_OFF_T, a_buf: *mut ::std::os::raw::c_char, a_len: usize, ) -> isize;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_read_block

- Signature: `pub fn tsk_fs_read_block( a_fs: *mut TSK_FS_INFO, a_addr: TSK_DADDR_T, a_buf: *mut ::std::os::raw::c_char, a_len: usize, ) -> isize;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_read_block_decrypt

- Signature: `pub fn tsk_fs_read_block_decrypt( a_fs: *mut TSK_FS_INFO, a_addr: TSK_DADDR_T, a_buf: *mut ::std::os::raw::c_char, a_len: usize, crypto_id: TSK_DADDR_T, ) -> isize;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_read_decrypt

- Signature: `pub fn tsk_fs_read_decrypt( a_fs: *mut TSK_FS_INFO, a_off: TSK_OFF_T, a_buf: *mut ::std::os::raw::c_char, a_len: usize, crypto_id: TSK_DADDR_T, ) -> isize;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_type_print

- Signature: `pub fn tsk_fs_type_print(arg1: *mut FILE);`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_type_supported

- Signature: `pub fn tsk_fs_type_supported() -> TSK_FS_TYPE_ENUM;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_type_toid

- Signature: `pub fn tsk_fs_type_toid(arg1: *const TSK_TCHAR) -> TSK_FS_TYPE_ENUM;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_type_toid_utf8

- Signature: `pub fn tsk_fs_type_toid_utf8(arg1: *const ::std::os::raw::c_char) -> TSK_FS_TYPE_ENUM;`
- What it does: Performs filesystem operations and information queries.

### tsk_fs_type_toname

- Signature: `pub fn tsk_fs_type_toname(arg1: TSK_FS_TYPE_ENUM) -> *const ::std::os::raw::c_char;`
- What it does: Performs filesystem operations and information queries.


## hdb

### tsk_hdb_accepts_updates

- Signature: `pub fn tsk_hdb_accepts_updates(arg1: *mut TSK_HDB_INFO) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_add_entry

- Signature: `pub fn tsk_hdb_add_entry( arg1: *mut TSK_HDB_INFO, arg2: *const ::std::os::raw::c_char, arg3: *const ::std::os::raw::c_char, arg4: *const ::std::os::raw::c_char, arg5: *const ::std::os::raw::c_char, arg6: *const ::std::os::raw::c_char, ) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_begin_transaction

- Signature: `pub fn tsk_hdb_begin_transaction(arg1: *mut TSK_HDB_INFO) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_close

- Signature: `pub fn tsk_hdb_close(arg1: *mut TSK_HDB_INFO);`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_commit_transaction

- Signature: `pub fn tsk_hdb_commit_transaction(arg1: *mut TSK_HDB_INFO) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_create

- Signature: `pub fn tsk_hdb_create(arg1: *mut TSK_TCHAR) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_get_db_path

- Signature: `pub fn tsk_hdb_get_db_path(hdb_info: *mut TSK_HDB_INFO) -> *const TSK_TCHAR;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_get_display_name

- Signature: `pub fn tsk_hdb_get_display_name(hdb_info: *mut TSK_HDB_INFO) -> *const ::std::os::raw::c_char;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_get_idx_path

- Signature: `pub fn tsk_hdb_get_idx_path( arg1: *mut TSK_HDB_INFO, arg2: TSK_HDB_HTYPE_ENUM, ) -> *const TSK_TCHAR;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_has_idx

- Signature: `pub fn tsk_hdb_has_idx(hdb_info: *mut TSK_HDB_INFO, arg1: TSK_HDB_HTYPE_ENUM) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_is_idx_only

- Signature: `pub fn tsk_hdb_is_idx_only(arg1: *mut TSK_HDB_INFO) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_lookup_raw

- Signature: `pub fn tsk_hdb_lookup_raw( arg1: *mut TSK_HDB_INFO, arg2: *mut u8, arg3: u8, arg4: TSK_HDB_FLAG_ENUM, arg5: TSK_HDB_LOOKUP_FN, arg6: *mut ::std::os::raw::c_void, ) -> i8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_lookup_str

- Signature: `pub fn tsk_hdb_lookup_str( arg1: *mut TSK_HDB_INFO, arg2: *const ::std::os::raw::c_char, arg3: TSK_HDB_FLAG_ENUM, arg4: TSK_HDB_LOOKUP_FN, arg5: *mut ::std::os::raw::c_void, ) -> i8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_lookup_verbose_str

- Signature: `pub fn tsk_hdb_lookup_verbose_str( arg1: *mut TSK_HDB_INFO, arg2: *const ::std::os::raw::c_char, arg3: *mut ::std::os::raw::c_void, ) -> i8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_make_index

- Signature: `pub fn tsk_hdb_make_index(arg1: *mut TSK_HDB_INFO, arg2: *mut TSK_TCHAR) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_open

- Signature: `pub fn tsk_hdb_open(arg1: *mut TSK_TCHAR, arg2: TSK_HDB_OPEN_ENUM) -> *mut TSK_HDB_INFO;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_open_idx

- Signature: `pub fn tsk_hdb_open_idx(arg1: *mut TSK_HDB_INFO, arg2: TSK_HDB_HTYPE_ENUM) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_rollback_transaction

- Signature: `pub fn tsk_hdb_rollback_transaction(arg1: *mut TSK_HDB_INFO) -> u8;`
- What it does: Works with hash databases (lookup/index operations).

### tsk_hdb_uses_external_indexes

- Signature: `pub fn tsk_hdb_uses_external_indexes(arg1: *mut TSK_HDB_INFO) -> u8;`
- What it does: Works with hash databases (lookup/index operations).


## img

### tsk_img_close

- Signature: `pub fn tsk_img_close(arg1: *mut TSK_IMG_INFO);`
- What it does: Closes a previously opened disk image handle.

### tsk_img_open

- Signature: `pub fn tsk_img_open( num_img: ::std::os::raw::c_int, images: *const *const TSK_TCHAR, arg1: TSK_IMG_TYPE_ENUM, a_ssize: ::std::os::raw::c_uint, ) -> *mut TSK_IMG_INFO;`
- What it does: Opens a disk image and returns an image handle.

### tsk_img_open_external

- Signature: `pub fn tsk_img_open_external( ext_img_info: *mut ::std::os::raw::c_void, size: TSK_OFF_T, sector_size: ::std::os::raw::c_uint, read: ::std::option::Option< unsafe extern "C" fn( img: *mut TSK_IMG_INFO, off: TSK_OFF_T, buf: *mut ::std::os::raw::c_char, len: usize, ) -> isize, >, close: ::std::option::Option<unsafe extern "C" fn(arg1: *mut TSK_IMG_INFO)>, imgstat: ::std::option::Option< unsafe extern "C" fn(arg1: *mut TSK_IMG_INFO, arg2: *mut FILE), >, ) -> *mut TSK_IMG_INFO;`
- What it does: Opens a disk image and returns an image handle.

### tsk_img_open_opt

- Signature: `pub fn tsk_img_open_opt( num_img: ::std::os::raw::c_int, images: *const *const TSK_TCHAR, arg1: TSK_IMG_TYPE_ENUM, a_ssize: ::std::os::raw::c_uint, opts: *const TSK_IMG_OPTIONS, ) -> *mut TSK_IMG_INFO;`
- What it does: Opens a disk image and returns an image handle.

### tsk_img_open_sing

- Signature: `pub fn tsk_img_open_sing( a_image: *const TSK_TCHAR, type_: TSK_IMG_TYPE_ENUM, a_ssize: ::std::os::raw::c_uint, ) -> *mut TSK_IMG_INFO;`
- What it does: Opens a disk image and returns an image handle.

### tsk_img_open_sing_opt

- Signature: `pub fn tsk_img_open_sing_opt( a_image: *const TSK_TCHAR, type_: TSK_IMG_TYPE_ENUM, a_ssize: ::std::os::raw::c_uint, opts: *const TSK_IMG_OPTIONS, ) -> *mut TSK_IMG_INFO;`
- What it does: Opens a disk image and returns an image handle.

### tsk_img_open_utf8

- Signature: `pub fn tsk_img_open_utf8( num_img: ::std::os::raw::c_int, images: *const *const ::std::os::raw::c_char, type_: TSK_IMG_TYPE_ENUM, a_ssize: ::std::os::raw::c_uint, ) -> *mut TSK_IMG_INFO;`
- What it does: Opens a disk image and returns an image handle.

### tsk_img_open_utf8_opt

- Signature: `pub fn tsk_img_open_utf8_opt( num_img: ::std::os::raw::c_int, images: *const *const ::std::os::raw::c_char, type_: TSK_IMG_TYPE_ENUM, a_ssize: ::std::os::raw::c_uint, opts: *const TSK_IMG_OPTIONS, ) -> *mut TSK_IMG_INFO;`
- What it does: Opens a disk image and returns an image handle.

### tsk_img_open_utf8_sing

- Signature: `pub fn tsk_img_open_utf8_sing( a_image: *const ::std::os::raw::c_char, type_: TSK_IMG_TYPE_ENUM, a_ssize: ::std::os::raw::c_uint, ) -> *mut TSK_IMG_INFO;`
- What it does: Opens a disk image and returns an image handle.

### tsk_img_open_utf8_sing_opt

- Signature: `pub fn tsk_img_open_utf8_sing_opt( a_image: *const ::std::os::raw::c_char, type_: TSK_IMG_TYPE_ENUM, a_ssize: ::std::os::raw::c_uint, opts: *const TSK_IMG_OPTIONS, ) -> *mut TSK_IMG_INFO;`
- What it does: Opens a disk image and returns an image handle.

### tsk_img_read

- Signature: `pub fn tsk_img_read( img: *mut TSK_IMG_INFO, off: TSK_OFF_T, buf: *mut ::std::os::raw::c_char, len: usize, ) -> isize;`
- What it does: Reads bytes from a disk image at a byte offset.

### tsk_img_type_print

- Signature: `pub fn tsk_img_type_print(arg1: *mut FILE);`
- What it does: Performs image-layer operations (type conversion, access, or metadata).

### tsk_img_type_supported

- Signature: `pub fn tsk_img_type_supported() -> TSK_IMG_TYPE_ENUM;`
- What it does: Performs image-layer operations (type conversion, access, or metadata).

### tsk_img_type_todesc

- Signature: `pub fn tsk_img_type_todesc(arg1: TSK_IMG_TYPE_ENUM) -> *const ::std::os::raw::c_char;`
- What it does: Performs image-layer operations (type conversion, access, or metadata).

### tsk_img_type_toid

- Signature: `pub fn tsk_img_type_toid(arg1: *const TSK_TCHAR) -> TSK_IMG_TYPE_ENUM;`
- What it does: Performs image-layer operations (type conversion, access, or metadata).

### tsk_img_type_toid_utf8

- Signature: `pub fn tsk_img_type_toid_utf8(arg1: *const ::std::os::raw::c_char) -> TSK_IMG_TYPE_ENUM;`
- What it does: Performs image-layer operations (type conversion, access, or metadata).

### tsk_img_type_toname

- Signature: `pub fn tsk_img_type_toname(arg1: TSK_IMG_TYPE_ENUM) -> *const ::std::os::raw::c_char;`
- What it does: Performs image-layer operations (type conversion, access, or metadata).


## list

### tsk_list_add

- Signature: `pub fn tsk_list_add(list: *mut *mut TSK_LIST, key: u64) -> u8;`
- What it does: Sleuth Kit exported API function.

### tsk_list_find

- Signature: `pub fn tsk_list_find(list: *mut TSK_LIST, key: u64) -> u8;`
- What it does: Sleuth Kit exported API function.

### tsk_list_free

- Signature: `pub fn tsk_list_free(list: *mut TSK_LIST);`
- What it does: Sleuth Kit exported API function.


## parse

### tsk_parse_offset

- Signature: `pub fn tsk_parse_offset(arg1: *const TSK_TCHAR) -> TSK_OFF_T;`
- What it does: Sleuth Kit exported API function.

### tsk_parse_pnum

- Signature: `pub fn tsk_parse_pnum( a_pnum_str: *const TSK_TCHAR, a_pnum: *mut TSK_PNUM_T, ) -> ::std::os::raw::c_int;`
- What it does: Sleuth Kit exported API function.


## pool

### tsk_pool_close

- Signature: `pub fn tsk_pool_close(arg1: *const TSK_POOL_INFO);`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_open

- Signature: `pub fn tsk_pool_open( num_vols: ::std::os::raw::c_int, parts: *const *const TSK_VS_PART_INFO, type_: TSK_POOL_TYPE_ENUM, ) -> *const TSK_POOL_INFO;`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_open_img

- Signature: `pub fn tsk_pool_open_img( num_imgs: ::std::os::raw::c_int, imgs: *const *mut TSK_IMG_INFO, offsets: *const TSK_OFF_T, type_: TSK_POOL_TYPE_ENUM, ) -> *const TSK_POOL_INFO;`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_open_img_sing

- Signature: `pub fn tsk_pool_open_img_sing( img: *mut TSK_IMG_INFO, offset: TSK_OFF_T, type_: TSK_POOL_TYPE_ENUM, ) -> *const TSK_POOL_INFO;`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_open_sing

- Signature: `pub fn tsk_pool_open_sing( part: *const TSK_VS_PART_INFO, type_: TSK_POOL_TYPE_ENUM, ) -> *const TSK_POOL_INFO;`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_read

- Signature: `pub fn tsk_pool_read( a_fs: *mut TSK_POOL_INFO, a_off: TSK_OFF_T, a_buf: *mut ::std::os::raw::c_char, a_len: usize, ) -> isize;`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_type_print

- Signature: `pub fn tsk_pool_type_print(hFile: *mut FILE);`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_type_toid

- Signature: `pub fn tsk_pool_type_toid(str_: *const TSK_TCHAR) -> TSK_POOL_TYPE_ENUM;`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_type_toid_utf8

- Signature: `pub fn tsk_pool_type_toid_utf8(str_: *const ::std::os::raw::c_char) -> TSK_POOL_TYPE_ENUM;`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_type_toname

- Signature: `pub fn tsk_pool_type_toname(ptype: TSK_POOL_TYPE_ENUM) -> *const ::std::os::raw::c_char;`
- What it does: Opens and inspects storage pool structures.

### tsk_pool_unallocated_runs

- Signature: `pub fn tsk_pool_unallocated_runs(arg1: *const TSK_POOL_INFO) -> *mut TSK_FS_ATTR_RUN;`
- What it does: Opens and inspects storage pool structures.


## print

### tsk_print_sanitized

- Signature: `pub fn tsk_print_sanitized( fd: *mut FILE, str_: *const ::std::os::raw::c_char, ) -> ::std::os::raw::c_int;`
- What it does: Sleuth Kit exported API function.


## other

### tsk_printf

- Signature: `pub fn tsk_printf(msg: *const ::std::os::raw::c_char, ...);`
- What it does: Sleuth Kit exported API function.


## stack

### tsk_stack_create

- Signature: `pub fn tsk_stack_create() -> *mut TSK_STACK;`
- What it does: Sleuth Kit exported API function.

### tsk_stack_find

- Signature: `pub fn tsk_stack_find(stack: *mut TSK_STACK, key: u64) -> u8;`
- What it does: Sleuth Kit exported API function.

### tsk_stack_free

- Signature: `pub fn tsk_stack_free(stack: *mut TSK_STACK);`
- What it does: Sleuth Kit exported API function.

### tsk_stack_pop

- Signature: `pub fn tsk_stack_pop(stack: *mut TSK_STACK);`
- What it does: Sleuth Kit exported API function.

### tsk_stack_push

- Signature: `pub fn tsk_stack_push(stack: *mut TSK_STACK, key: u64) -> u8;`
- What it does: Sleuth Kit exported API function.


## version

### tsk_version_get_str

- Signature: `pub fn tsk_version_get_str() -> *const ::std::os::raw::c_char;`
- What it does: Sleuth Kit exported API function.

### tsk_version_print

- Signature: `pub fn tsk_version_print(arg1: *mut FILE);`
- What it does: Sleuth Kit exported API function.


## vs

### tsk_vs_close

- Signature: `pub fn tsk_vs_close(arg1: *mut TSK_VS_INFO);`
- What it does: Closes an opened volume-system handle.

### tsk_vs_open

- Signature: `pub fn tsk_vs_open( arg1: *mut TSK_IMG_INFO, arg2: TSK_DADDR_T, arg3: TSK_VS_TYPE_ENUM, ) -> *mut TSK_VS_INFO;`
- What it does: Opens volume-system metadata from an image or pool.

### tsk_vs_part_get

- Signature: `pub fn tsk_vs_part_get(arg1: *const TSK_VS_INFO, idx: TSK_PNUM_T) -> *const TSK_VS_PART_INFO;`
- What it does: Accesses partition or volume entries within a volume system.

### tsk_vs_part_read

- Signature: `pub fn tsk_vs_part_read( a_vs_part: *const TSK_VS_PART_INFO, a_off: TSK_OFF_T, buf: *mut ::std::os::raw::c_char, len: usize, ) -> isize;`
- What it does: Accesses partition or volume entries within a volume system.

### tsk_vs_part_read_block

- Signature: `pub fn tsk_vs_part_read_block( a_vs_part: *const TSK_VS_PART_INFO, a_addr: TSK_DADDR_T, buf: *mut ::std::os::raw::c_char, len: usize, ) -> isize;`
- What it does: Accesses partition or volume entries within a volume system.

### tsk_vs_part_walk

- Signature: `pub fn tsk_vs_part_walk( vs: *mut TSK_VS_INFO, start: TSK_PNUM_T, last: TSK_PNUM_T, flags: TSK_VS_PART_FLAG_ENUM, action: TSK_VS_PART_WALK_CB, ptr: *mut ::std::os::raw::c_void, ) -> u8;`
- What it does: Accesses partition or volume entries within a volume system.

### tsk_vs_read_block

- Signature: `pub fn tsk_vs_read_block( a_vs: *mut TSK_VS_INFO, a_addr: TSK_DADDR_T, buf: *mut ::std::os::raw::c_char, len: usize, ) -> isize;`
- What it does: Performs volume-system operations and metadata access.

### tsk_vs_type_print

- Signature: `pub fn tsk_vs_type_print(arg1: *mut FILE);`
- What it does: Performs volume-system operations and metadata access.

### tsk_vs_type_supported

- Signature: `pub fn tsk_vs_type_supported() -> TSK_VS_TYPE_ENUM;`
- What it does: Performs volume-system operations and metadata access.

### tsk_vs_type_todesc

- Signature: `pub fn tsk_vs_type_todesc(arg1: TSK_VS_TYPE_ENUM) -> *const ::std::os::raw::c_char;`
- What it does: Performs volume-system operations and metadata access.

### tsk_vs_type_toid

- Signature: `pub fn tsk_vs_type_toid(arg1: *const TSK_TCHAR) -> TSK_VS_TYPE_ENUM;`
- What it does: Performs volume-system operations and metadata access.

### tsk_vs_type_toid_utf8

- Signature: `pub fn tsk_vs_type_toid_utf8(arg1: *const ::std::os::raw::c_char) -> TSK_VS_TYPE_ENUM;`
- What it does: Performs volume-system operations and metadata access.

### tsk_vs_type_toname

- Signature: `pub fn tsk_vs_type_toname(arg1: TSK_VS_TYPE_ENUM) -> *const ::std::os::raw::c_char;`
- What it does: Performs volume-system operations and metadata access.

