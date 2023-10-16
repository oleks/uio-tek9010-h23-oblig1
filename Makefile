mkfile_path:=$(abspath $(lastword $(MAKEFILE_LIST)))
image_name:=$(notdir $(patsubst %/,%,$(dir $(mkfile_path))))

build:
	docker build -t $(image_name) .

interact:
	docker run \
	  -it --rm \
	  -p 8080:8080 \
	  -v $(PWD):/app \
	  -w /app/src \
	  --entrypoint /bin/ash \
	  $(image_name)
