.PHONY: dep test build release upload

YARN_FLAGS            ?= --non-interactive --no-progress --silent --emoji false
YARN                   = yarn $(YARN_FLAGS)

APP                   ?= corteza-server-corredor

BUILD_FLAVOUR         ?= corteza
BUILD_DEST_DIR         = dist
BUILD_TIME            ?= $(shell date +%FT%T%z)
BUILD_VERSION         ?= $(shell git describe --tags --abbrev=0)
BUILD_NAME             = corteza-server-corredor-$(BUILD_VERSION)

RELEASE_NAME           = $(BUILD_NAME).tar.gz
RELEASE_EXTRA_FILES   ?= README.* LICENSE CONTRIBUTING.md DCO .env.example
RELEASE_PKEY          ?= .upload-rsa

dep:
	$(YARN) install

test:
	$(YARN) lint
	$(YARN) test:unit

build:
	modclean --run --no-progress --error-halt
	$(YARN) build

release:
	@ mkdir -p .tmp/$(APP)
	@ cp -r $(RELEASE_EXTRA_FILES) $(BUILD_DEST_DIR) node_modules .tmp/$(APP)/
	@ tar -C .tmp -czf $(RELEASE_NAME) $(APP)

upload: $(RELEASE_PKEY)
	@ echo "put *.tar.gz" | sftp -q -i $(RELEASE_PKEY) $(RELEASE_SFTP_URI)
	@ rm -f $(RELEASE_PKEY)

$(RELEASE_PKEY):
	@ echo $(RELEASE_SFTP_KEY) | base64 -d > $(RELEASE_PKEY)
	@ chmod 0400 $@
