# **Chapter 7: Packages, Modules, and Error Handling**

Go's approach to code organization and error handling are two of its most distinctive features. The package and module systems provide a clean way to structure your code, while Go's error handling philosophy treats errors as values that can be explicitly returned, checked, and handled. Together, these systems help you write robust, maintainable code that's easy to collaborate on.

In this chapter, you'll learn how to organize your code into packages, manage dependencies with modules, and implement effective error handling patterns that make your applications more reliable.

## **7.1 Understanding Go Packages**

### **7.1.1 What is a Package?**

A package is Go's unit of code organization and reuse. Every Go file belongs to a package, declared at the top of the file:

```go
package mypackage
```

Packages serve several important purposes:

1. **Code organization**: Group related code together
2. **Encapsulation**: Control visibility of functions, types, and variables
3. **Reusability**: Use code across multiple projects
4. **Compilation**: Compiled as a unit

### **7.1.2 Package Naming Conventions**

In Go, package names should be:

- **Short and concise**: Prefer single-word names
- **Lowercase**: Never use camelCase or snake_case
- **Descriptive**: Reflect the package's purpose
- **Not pluralized**: Use `store` not `stores`
- **Not generic**: Avoid names like `util`, `common`, or `misc`

Good package names include:

```
http     // for HTTP client and server implementations
json     // for JSON encoding and decoding
io       // for I/O operations
fmt      // for formatting and printing
strings  // for string manipulation
math     // for mathematical operations
```

### **7.1.3 Package Visibility Rules**

Go controls visibility (public vs. private) through identifier naming:

- **Exported (public)**: Identifiers starting with an uppercase letter are accessible from other packages
- **Unexported (private)**: Identifiers starting with a lowercase letter are only accessible within the same package

```go
package geometry

// Circle is exported (public) - accessible from other packages
type Circle struct {
    Radius float64 // Exported field
    color  string  // Unexported field
}

// CalculateArea is exported (public) - accessible from other packages
func (c Circle) CalculateArea() float64 {
    return 3.14 * c.Radius * c.Radius
}

// setColor is unexported (private) - only accessible within this package
func (c *Circle) setColor(color string) {
    c.color = color
}
```

### **7.1.4 Package Documentation**

Go emphasizes documentation as part of the development process. Package documentation follows a simple format:

- Package-level documentation appears before the package declaration
- Exported identifier documentation appears directly above the identifier

```go
// Package geometry provides utilities for geometric calculations.
// It supports various shapes like circles, rectangles, and triangles.
package geometry

// Circle represents a circle shape with a radius.
type Circle struct {
    Radius float64
}

// CalculateArea returns the area of the circle.
func (c Circle) CalculateArea() float64 {
    return 3.14 * c.Radius * c.Radius
}
```

Access documentation with `go doc`:

```bash
go doc geometry           # View package documentation
go doc geometry.Circle    # View Circle type documentation
```

## **7.2 Working with Multiple Files and Packages**

### **7.2.1 Multi-file Packages**

A package can span multiple files. When you do this:

1. Each file must declare the same package name
2. All files in the same directory must belong to the same package
3. Functions, types, and variables can reference each other directly without import

Example:

**shapes.go**:

```go
package geometry

// Shape is an interface that all shapes implement
type Shape interface {
    CalculateArea() float64
    CalculatePerimeter() float64
}

// defaultColor returns the default color for shapes
func defaultColor() string {
    return "black"
}
```

**circle.go**:

```go
package geometry

// Circle implements the Shape interface
type Circle struct {
    Radius float64
    color  string
}

// NewCircle creates a new Circle with the default color
func NewCircle(radius float64) Circle {
    return Circle{
        Radius: radius,
        color:  defaultColor(), // Using function from shapes.go
    }
}

// CalculateArea returns the area of the circle
func (c Circle) CalculateArea() float64 {
    return 3.14 * c.Radius * c.Radius
}

// CalculatePerimeter returns the perimeter of the circle
func (c Circle) CalculatePerimeter() float64 {
    return 2 * 3.14 * c.Radius
}
```

### **7.2.2 Package Directory Structure**

A typical Go project with multiple packages might have a structure like this:

```
myproject/
├── main.go                   # main package
├── geometry/
│   ├── shapes.go             # geometry package
│   ├── circle.go
│   └── rectangle.go
└── drawing/
    ├── canvas.go             # drawing package
    └── color.go
```

Each subdirectory represents a separate package, and all files within that directory must belong to the same package.

### **7.2.3 Importing Packages**

To use code from another package, you must import it:

```go
package main

import (
    "fmt"
    "myproject/geometry"
)

func main() {
    circle := geometry.NewCircle(5.0)
    area := circle.CalculateArea()
    fmt.Printf("Circle area: %.2f\n", area)
}
```

**Import Aliases**:

You can create aliases for package names to avoid conflicts or for convenience:

```go
import (
    "fmt"
    geo "myproject/geometry"  // Alias for the geometry package
)

func main() {
    circle := geo.NewCircle(5.0)
    // ...
}
```

**Dot Imports**:

The dot import makes exported identifiers directly accessible (without the package prefix), but it's generally discouraged as it reduces clarity:

```go
import (
    "fmt"
    . "myproject/geometry"  // Dot import, use with caution
)

func main() {
    circle := NewCircle(5.0)  // No package prefix needed
    // ...
}
```

**Blank Imports**:

Sometimes you need to import a package for its side effects only (init functions):

```go
import (
    "fmt"
    _ "github.com/lib/pq"  // Registers PostgreSQL driver, but doesn't use the package directly
)
```

## **7.3 Standard Library Packages**

The Go standard library is comprehensive and well-designed, providing core functionality without needing external dependencies.

### **7.3.1 Core Packages**

Here are some of the most commonly used standard library packages:

| Package       | Description                         | Example Usage                     |
| ------------- | ----------------------------------- | --------------------------------- |
| fmt           | Formatted I/O                       | Printing, string formatting       |
| io            | Basic I/O interfaces                | Readers, writers, copying         |
| os            | Operating system functionality      | File operations, environment vars |
| strings       | String manipulation                 | Searching, replacing, comparing   |
| strconv       | String conversions                  | Parsing numbers, formatting       |
| time          | Time-related functions              | Date/time parsing, formatting     |
| encoding/json | JSON encoding/decoding              | API responses, configuration      |
| net/http      | HTTP client and server              | Web APIs, microservices           |
| database/sql  | Database access                     | Working with relational databases |
| context       | Request-scoped values, cancellation | API timeout, cancellation         |

### **7.3.2 Using the Standard Library**

The standard library is imported like any other package:

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type User struct {
    Name     string    `json:"name"`
    Email    string    `json:"email"`
    JoinDate time.Time `json:"join_date"`
}

func main() {
    // Using time package
    now := time.Now()

    // Create a struct
    user := User{
        Name:     "Alice",
        Email:    "alice@example.com",
        JoinDate: now,
    }

    // Using json package
    jsonData, err := json.Marshal(user)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println(string(jsonData))

    // Using http package
    http.HandleFunc("/user", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write(jsonData)
    })

    fmt.Println("Server starting on :8080...")
    http.ListenAndServe(":8080", nil)
}
```

The standard library is your first resource when solving common problems in Go. It's well-documented, thoroughly tested, and designed to work seamlessly with the language.

## **7.4 Go Modules**

Go Modules, introduced in Go 1.11, is the official dependency management system for Go. It allows you to track, version, and manage dependencies outside of the GOPATH.

### **7.4.1 Creating a New Module**

To create a new module, use the `go mod init` command:

```bash
mkdir myproject
cd myproject
go mod init github.com/username/myproject
```

This creates a `go.mod` file that defines your module and its dependencies:

```
module github.com/username/myproject

go 1.18
```

### **7.4.2 Adding Dependencies**

When you import a package that's not in the standard library or your module, Go automatically adds it to your `go.mod` file when you run a command like `go build` or `go test`.

```go
package main

import (
    "fmt"
    "github.com/google/uuid"  // External dependency
)

func main() {
    id := uuid.New()
    fmt.Printf("Generated UUID: %s\n", id.String())
}
```

Running `go build` will update your `go.mod` file:

```
module github.com/username/myproject

go 1.18

require github.com/google/uuid v1.3.0
```

It also creates a `go.sum` file that contains cryptographic hashes of your dependencies, ensuring reproducible builds.

### **7.4.3 Managing Versions**

You can explicitly upgrade or downgrade dependencies:

```bash
go get github.com/google/uuid@v1.2.0  # Specific version
go get github.com/google/uuid@latest  # Latest version
go get -u                             # Update all dependencies
```

To clean up unused dependencies:

```bash
go mod tidy
```

### **7.4.4 Creating Versioned Releases**

For your own modules, you should follow semantic versioning with Git tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Major version changes (v2 and beyond) require special handling in Go modules, typically by adding the major version to the module path:

```
module github.com/username/myproject/v2
```

## **7.5 Go's Error Handling Philosophy**

### **7.5.1 Errors as Values**

Unlike many programming languages that use exceptions for error handling, Go treats errors as ordinary values. This fundamental design choice has several important implications:

- **Explicit error checking**: Errors must be explicitly checked and handled
- **Predictable control flow**: No hidden "throw" statements that might redirect execution
- **Composition over inheritance**: Error types can be composed and wrapped
- **Simplicity**: A single, consistent pattern for handling errors

The standard `error` interface in Go is remarkably simple:

```go
type error interface {
    Error() string
}
```

Any type that implements this interface can be used as an error. This minimalist approach provides great flexibility while maintaining clarity.

### **7.5.2 The Multiple Return Value Pattern**

The most common error handling pattern in Go uses multiple return values:

```go
func DoSomething() (Result, error) {
    // Implementation...
    if problem {
        return ZeroValue, errors.New("something went wrong")
    }
    return result, nil
}

// Usage
result, err := DoSomething()
if err != nil {
    // Handle error
    return // Or continue with a fallback strategy
}
// Use result...
```

This pattern makes error handling visible and encourages developers to consider failure cases explicitly.

## **7.6 Creating and Returning Errors**

### **7.6.1 Simple Error Creation**

The standard library provides several ways to create errors:

```go
package main

import (
    "errors"
    "fmt"
)

func main() {
    // Method 1: Using errors.New
    err1 := errors.New("something went wrong")

    // Method 2: Using fmt.Errorf (allows formatting)
    name := "config file"
    err2 := fmt.Errorf("failed to load %s", name)

    fmt.Println(err1) // something went wrong
    fmt.Println(err2) // failed to load config file
}
```

### **7.6.2 Custom Error Types**

For more sophisticated error handling, you can create custom error types:

```go
package main

import (
    "fmt"
)

// ValidationError represents an input validation error
type ValidationError struct {
    Field string
    Message string
}

// Implement the error interface
func (e ValidationError) Error() string {
    return fmt.Sprintf("validation error on field %s: %s", e.Field, e.Message)
}

// Function that returns custom error
func ValidateUsername(username string) error {
    if len(username) < 3 {
        return ValidationError{
            Field: "username",
            Message: "must be at least 3 characters long",
        }
    }
    return nil
}

func main() {
    err := ValidateUsername("ab")
    if err != nil {
        fmt.Println(err) // validation error on field username: must be at least 3 characters long

        // Type assertion to access specific fields
        if valErr, ok := err.(ValidationError); ok {
            fmt.Printf("Field: %s, Message: %s\n", valErr.Field, valErr.Message)
        }
    }
}
```

Custom error types allow you to:

- Include structured data in your errors
- Create type hierarchies for different error categories
- Enable type assertions for specific error handling

### **7.6.3 Sentinel Errors**

For errors that need to be checked by identity rather than content, you can define package-level "sentinel" error variables:

```go
package userservice

import "errors"

// Public sentinel errors that can be checked by callers
var (
    ErrUserNotFound = errors.New("user not found")
    ErrPermissionDenied = errors.New("permission denied")
    ErrInvalidInput = errors.New("invalid input")
)

func GetUser(id string) (*User, error) {
    // Implementation...
    if userDoesNotExist {
        return nil, ErrUserNotFound
    }
    // ...
}

// Usage in another package
user, err := userservice.GetUser("123")
if err == userservice.ErrUserNotFound {
    // Handle specifically for user not found
} else if err != nil {
    // Handle other errors
}
```

Sentinel errors are particularly useful for expected error conditions that callers might want to handle specifically.

## **7.7 Error Handling Patterns**

### **7.7.1 The Guard Clause Pattern**

A common pattern in Go is to use "guard clauses" to handle errors early and reduce nesting:

```go
// Without guard clauses (deeply nested)
func ProcessFile(path string) error {
    file, err := os.Open(path)
    if err == nil {
        defer file.Close()

        data, err := io.ReadAll(file)
        if err == nil {
            config, err := parseConfig(data)
            if err == nil {
                return processConfig(config)
            } else {
                return fmt.Errorf("parsing config: %w", err)
            }
        } else {
            return fmt.Errorf("reading file: %w", err)
        }
    } else {
        return fmt.Errorf("opening file: %w", err)
    }
}

// With guard clauses (flat and clean)
func ProcessFile(path string) error {
    file, err := os.Open(path)
    if err != nil {
        return fmt.Errorf("opening file: %w", err)
    }
    defer file.Close()

    data, err := io.ReadAll(file)
    if err != nil {
        return fmt.Errorf("reading file: %w", err)
    }

    config, err := parseConfig(data)
    if err != nil {
        return fmt.Errorf("parsing config: %w", err)
    }

    return processConfig(config)
}
```

The guard clause pattern creates a flatter function structure that's easier to read and reason about.

### **7.7.2 Wrapping Errors for Context**

Go 1.13 introduced error wrapping, which allows you to add context while preserving the original error:

```go
package main

import (
    "errors"
    "fmt"
)

func readConfig(path string) error {
    // Simulate a "file not found" error
    err := errors.New("file not found")

    // Wrap the error with additional context
    return fmt.Errorf("failed to read config from %s: %w", path, err)
}

func setupApp() error {
    err := readConfig("/etc/myapp/config.json")
    if err != nil {
        // Wrap again with higher-level context
        return fmt.Errorf("app initialization failed: %w", err)
    }
    return nil
}

func main() {
    err := setupApp()
    if err != nil {
        fmt.Println("Error:", err)

        // Unwrap to check for specific error types
        if errors.Is(err, errors.New("file not found")) {
            fmt.Println("Config file is missing, creating default...")
        }
    }
}
```

The `%w` verb wraps errors while preserving the original for later inspection using `errors.Is()` or `errors.As()`.

### **7.7.3 Working with Multiple Error Types**

The `errors.Is()` and `errors.As()` functions help work with wrapped errors:

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

func main() {
    // Try to open a non-existent file
    _, err := os.Open("non-existent.txt")

    // Wrap the error
    wrappedErr := fmt.Errorf("operation failed: %w", err)

    // Check if the wrapped error contains a specific error
    if errors.Is(wrappedErr, os.ErrNotExist) {
        fmt.Println("The file does not exist")
    }

    // Working with custom error types
    type ValidationError struct {
        Field string
    }

    func (v ValidationError) Error() string {
        return fmt.Sprintf("validation failed on %s", v.Field)
    }

    originalErr := ValidationError{Field: "username"}
    wrappedErr = fmt.Errorf("could not process request: %w", originalErr)

    // Extract the original error
    var valErr ValidationError
    if errors.As(wrappedErr, &valErr) {
        fmt.Println("Validation error on field:", valErr.Field)
    }
}
```

## **7.8 Best Practices for Error Handling**

### **7.8.1 Handle Errors Once**

Handle each error at the appropriate level and avoid re-handling the same error:

```go
// Good: Handle at appropriate level
func processInput(input string) error {
    value, err := parseInput(input)
    if err != nil {
        return fmt.Errorf("invalid input: %w", err)
    }

    result, err := calculate(value)
    if err != nil {
        return fmt.Errorf("calculation error: %w", err)
    }

    return saveResult(result)
}

// Bad: Multiple error logging
func processInput(input string) error {
    value, err := parseInput(input)
    if err != nil {
        log.Printf("Parse error: %v", err) // Don't log here
        return err
    }

    result, err := calculate(value)
    if err != nil {
        log.Printf("Calculation error: %v", err) // Don't log here
        return err
    }

    err = saveResult(result)
    if err != nil {
        log.Printf("Save error: %v", err) // Don't log here
        return err
    }

    return nil
}
```

### **7.8.2 Provide Context**

Always add context to errors to help with debugging:

```go
// Poor error handling (insufficient context)
if err != nil {
    return err
}

// Better error handling (with context)
if err != nil {
    return fmt.Errorf("processing order %d: %w", orderID, err)
}
```

### **7.8.3 Don't Panic**

In production code, prefer returning errors over using `panic`:

```go
// Bad: Using panic
func getConfigValue(key string) string {
    value, exists := configs[key]
    if !exists {
        panic(fmt.Sprintf("missing required config: %s", key))
    }
    return value
}

// Good: Return error
func getConfigValue(key string) (string, error) {
    value, exists := configs[key]
    if !exists {
        return "", fmt.Errorf("missing required config: %s", key)
    }
    return value, nil
}
```

Reserve `panic` for truly exceptional conditions that should crash the program.

## **7.9 Summary**

In this chapter, we've explored two fundamental aspects of Go programming: package organization with modules and error handling.

Go's package system provides a clean, modular approach to organizing code, with clear visibility rules controlled by capitalization. The module system builds on this to provide robust dependency management, making it easy to create reusable libraries and applications.

Meanwhile, Go's error handling philosophy treats errors as values, encouraging explicit error checking and handling. This approach leads to more reliable code by making failure cases visible and requiring deliberate decisions about how to handle them.

Together, these features contribute to Go's reputation for producing maintainable, reliable software that's easy to reason about and evolve over time.

**Next Up:** In Chapter 8, we'll explore Go's collection types including arrays, slices, and strings – the fundamental building blocks for storing and manipulating data in Go programs.
