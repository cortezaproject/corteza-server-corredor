.PHONY: build push run

TAG    := $(shell git describe --tags --abbrev=0)
IMAGE  := cortezaproject/corteza-server-corredor
DOCKER := docker

build:
	$(DOCKER) build --no-cache -t $(IMAGE):$(TAG) .

cached-build:
	$(DOCKER) build -t $(IMAGE):$(TAG) .

push:
	$(DOCKER) push $(IMAGE):$(TAG)

run:
	$(DOCKER) run --rm -it --env-file .env -P $(IMAGE):$(TAG)
