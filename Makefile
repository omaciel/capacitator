# Capacitator - Sprint Planning Calculator
# Makefile for building and running the application

.PHONY: build run clean deps test help

# Default target
all: build

# Build the application
build:
	go build -o capacitator main.go

# Run the application
run: build
	./capacitator

# Install/update dependencies
deps:
	go mod tidy
	go mod download

# Clean build artifacts
clean:
	rm -f capacitator
	go clean

# Run tests (if any exist)
test:
	go test ./...

# Build for different platforms
build-windows:
	GOOS=windows GOARCH=amd64 go build -o capacitator.exe main.go

build-linux:
	GOOS=linux GOARCH=amd64 go build -o capacitator-linux main.go

build-darwin:
	GOOS=darwin GOARCH=amd64 go build -o capacitator-darwin main.go

# Build for all platforms
build-all: build-windows build-linux build-darwin

# Package application (requires fyne package command)
package:
	fyne package -os darwin -icon icon.png

# Show help
help:
	@echo "Available targets:"
	@echo "  build         - Build the application"
	@echo "  run           - Build and run the application"
	@echo "  deps          - Install/update dependencies"
	@echo "  clean         - Clean build artifacts"
	@echo "  test          - Run tests"
	@echo "  build-windows - Build for Windows"
	@echo "  build-linux   - Build for Linux"
	@echo "  build-darwin  - Build for macOS"
	@echo "  build-all     - Build for all platforms"
	@echo "  package       - Package application for distribution"
	@echo "  help          - Show this help message"