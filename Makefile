.PHONY: build push run

TAG=$()
IMAGE=cortezaproject/corteza-server-corredor

build:
	echo docker build --no-cache -t $(IMAGE):$(TAG) .

push:
	echo docker push $(IMAGE):$(TAG)

run:
	echo docker run --rm -it -e -P $(IMAGE):$(TAG)
