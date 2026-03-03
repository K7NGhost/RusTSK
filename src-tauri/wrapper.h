#ifndef RUSTSK_WRAPPER_H
#define RUSTSK_WRAPPER_H

/*
 * Prefer flattened include layout used by vendored Windows headers.
 * If the namespaced tree exists, defer to libtsk.h.
 */
#if __has_include("tsk/base/tsk_base.h")
#include "libtsk.h"
#else
#include "base/tsk_base.h"
#include "img/tsk_img.h"
#include "vs/tsk_vs.h"
#include "fs/tsk_fs.h"
#include "hashdb/tsk_hashdb.h"
#include "auto/tsk_auto.h"
#include "pool/tsk_pool.h"
#endif

#endif
