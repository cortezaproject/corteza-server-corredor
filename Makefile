.PHONY: build push run

TAG=latest
IMAGE=cortezaproject/corteza-server-corredor

build:
	docker build --no-cache -t $(IMAGE):$(TAG) .

push:
	docker push $(IMAGE):$(TAG)

run:
	docker run --rm -it -e -P $(IMAGE):$(TAG)
