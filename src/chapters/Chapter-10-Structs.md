# **Chapter 10: Structs and Methods in Go**

Go's approach to object-oriented programming centers around structs and methods, offering a simpler yet powerful alternative to traditional class-based inheritance. This chapter explores how Go uses structs as the foundation for complex data types and methods to add behavior, allowing you to build maintainable and modular code.

By understanding Go's unique approach to composition and encapsulation, you'll be able to create elegant designs that leverage Go's strengths while avoiding the complexities often associated with inheritance hierarchies.

## **10.1 Struct Fundamentals**

### **10.1.1 Defining and Creating Structs**

A struct is a composite data type that groups together variables under a single name. Each variable within a struct is called a field.

```go
package main

import "fmt"

// Define a struct type
type Person struct {
    FirstName string
    LastName  string
    Age       int
}

func main() {
    // Method 1: Create a struct with field names
    person1 := Person{
        FirstName: "Alice",
        LastName:  "Johnson",
        Age:       28,
    }

    // Method 2: Create a struct with ordered values (less readable)
    person2 := Person{"Bob", "Smith", 32}

    // Method 3: Create an empty struct and assign fields later
    var person3 Person
    person3.FirstName = "Charlie"
    person3.LastName = "Brown"
    person3.Age = 24

    fmt.Printf("Person 1: %+v\n", person1)
    fmt.Printf("Person 2: %+v\n", person2)
    fmt.Printf("Person 3: %+v\n", person3)
}
```

Key characteristics of structs:

- **Value Types**: Structs are copied when assigned or passed to functions
- **Zero Values**: Fields are initialized to their zero values if not specified
- **Field Access**: Fields are accessed using dot notation
- **Comparable**: Structs are comparable (with limitations) using `==` and `!=`

### **10.1.2 Struct Fields and Tags**

Struct fields can have additional metadata through tags:

```go
package main

import (
    "encoding/json"
    "fmt"
    "reflect"
)

type User struct {
    ID        int    `json:"id" db:"user_id"`
    Username  string `json:"username" db:"username"`
    Email     string `json:"email" db:"email"`
    CreatedAt string `json:"-"` // Ignored by JSON marshaling
}

func main() {
    user := User{
        ID:        1,
        Username:  "johndoe",
        Email:     "john@example.com",
        CreatedAt: "2023-01-01",
    }

    // Convert to JSON (field names from json tags)
    jsonData, _ := json.Marshal(user)
    fmt.Println(string(jsonData))
    // Output: {"id":1,"username":"johndoe","email":"john@example.com"}

    // Access tags using reflection
    t := reflect.TypeOf(user)
    field, _ := t.FieldByName("Email")
    fmt.Println("Email JSON tag:", field.Tag.Get("json"))
    fmt.Println("Email DB tag:", field.Tag.Get("db"))
}
```

Tags are string literals attached to struct fields that can be accessed at runtime through reflection. They're commonly used for:

- JSON/XML serialization directives
- Database column mapping
- Validation rules
- Documentation

### **10.1.3 Nested Structs**

Structs can contain other structs as fields:

```go
package main

import "fmt"

type Address struct {
    Street  string
    City    string
    Country string
    ZipCode string
}

type Employee struct {
    Name    string
    ID      int
    Contact Address // Nested struct
}

func main() {
    emp := Employee{
        Name: "Alice Johnson",
        ID:   12345,
        Contact: Address{
            Street:  "123 Main St",
            City:    "Boston",
            Country: "USA",
            ZipCode: "02101",
        },
    }

    fmt.Printf("Employee: %+v\n", emp)
    fmt.Printf("City: %s\n", emp.Contact.City)
}
```

Nested structs provide a way to organize related data hierarchically, but they create strong coupling between types.

### **10.1.4 Anonymous Structs**

Go allows the creation of one-off struct types without a named declaration:

```go
package main

import "fmt"

func main() {
    // Anonymous struct
    point := struct {
        X, Y int
    }{
        X: 10,
        Y: 20,
    }

    fmt.Printf("Point: %+v\n", point)

    // Anonymous structs are useful for one-off data grouping
    config := struct {
        Timeout int
        Cache   bool
    }{
        Timeout: 30,
        Cache:   true,
    }

    fmt.Printf("Config: %+v\n", config)
}
```

Anonymous structs are particularly useful for:

- One-time use structures
- Test data
- JSON mapping without defining a dedicated type
- Function arguments or return values that group related data

## **10.2 Methods and Receivers**

### **10.2.1 Adding Methods to Structs**

In Go, methods are functions associated with a specific type. The type that a method is associated with is called the receiver type.

```go
package main

import "fmt"

type Rectangle struct {
    Width  float64
    Height float64
}

// Method with a value receiver
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// Method with a pointer receiver
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}

    fmt.Printf("Original: %+v, Area: %.2f\n", rect, rect.Area())

    rect.Scale(2)
    fmt.Printf("After scaling: %+v, Area: %.2f\n", rect, rect.Area())
}
```

Key points about methods:

- Methods are declared outside the struct definition
- The receiver appears between the `func` keyword and the method name
- A receiver can be either a value or a pointer

### **10.2.2 Value vs. Pointer Receivers**

Value and pointer receivers have different behaviors:

```go
package main

import "fmt"

type Counter struct {
    count int
}

// Value receiver - gets a copy of the Counter
func (c Counter) IncrementValue() {
    c.count++  // Modifies the copy, not the original
    fmt.Println("Inside IncrementValue:", c.count)
}

// Pointer receiver - gets a pointer to the Counter
func (c *Counter) IncrementPointer() {
    c.count++  // Modifies the original Counter
    fmt.Println("Inside IncrementPointer:", c.count)
}

func main() {
    counter := Counter{count: 0}

    counter.IncrementValue()
    fmt.Println("After IncrementValue:", counter.count)  // Still 0

    counter.IncrementPointer()
    fmt.Println("After IncrementPointer:", counter.count)  // Now 1

    // Go automatically handles pointer vs. value:
    counterCopy := counter
    counterCopy.IncrementPointer()  // Automatically converted to (&counterCopy).IncrementPointer()
    fmt.Println("Counter copy after IncrementPointer:", counterCopy.count)  // 2
    fmt.Println("Original counter:", counter.count)  // Still 1
}
```

Guidelines for choosing receiver types:

1. **Use pointer receivers when:**

   - The method needs to modify the receiver
   - The receiver is a large struct (to avoid copying)
   - The type contains reference fields like slices or maps
   - Consistency is needed with other methods that require pointers

2. **Use value receivers when:**
   - The receiver is a small, immutable value (like basic types)
   - The method doesn't modify the receiver
   - The type is meant to be copied, like value types

### **10.2.3 Method Sets and Interfaces**

A type's method set determines which interfaces it implements:

```go
package main

import "fmt"

// An interface defining a method
type Shaper interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

// Method for Circle type
func (c Circle) Area() float64 {
    return 3.14 * c.Radius * c.Radius
}

type Square struct {
    Side float64
}

// Method for Square type
func (s *Square) Area() float64 {
    return s.Side * s.Side
}

func main() {
    // A Circle value implements Shaper
    var shape1 Shaper = Circle{Radius: 5}
    fmt.Printf("Circle area: %.2f\n", shape1.Area())

    // A Square value does NOT implement Shaper (method on *Square)
    // This would not compile: var shape2 Shaper = Square{Side: 5}

    // But a *Square does implement Shaper
    var shape2 Shaper = &Square{Side: 5}
    fmt.Printf("Square area: %.2f\n", shape2.Area())
}
```

Important rules for method sets:

- If you have a value receiver, both values and pointers can call the method
- If you have a pointer receiver, only pointers can call the method (in interface context)
- A value of type T only implements interfaces with methods that have value receivers
- A pointer to T implements interfaces with both value and pointer receivers

### **10.2.4 Method Chaining**

Method chaining (fluent interfaces) can be implemented by returning the receiver:

```go
package main

import "fmt"

type Builder struct {
    contents string
}

// Each method returns the receiver pointer to allow chaining
func (b *Builder) Add(text string) *Builder {
    b.contents += text
    return b
}

func (b *Builder) AddLine(text string) *Builder {
    b.contents += text + "\n"
    return b
}

func (b *Builder) String() string {
    return b.contents
}

func main() {
    // Method chaining
    message := new(Builder).
        Add("Hello, ").
        Add("World! ").
        AddLine("How are you?").
        AddLine("This is method chaining.").
        String()

    fmt.Println(message)
}
```

Method chaining creates more readable code when multiple operations are performed in sequence, but should be used judiciously.

## **10.3 Struct Composition and Embedding**

### **10.3.1 Composition Over Inheritance**

Go doesn't have inheritance, but uses composition to achieve code reuse:

```go
package main

import "fmt"

type Engine struct {
    Power int
    Type  string
}

func (e *Engine) Start() {
    fmt.Printf("Engine started: %s with %d horsepower\n", e.Type, e.Power)
}

type Car struct {
    Engine     Engine  // Composition: Car has-an Engine
    Model      string
    Manufacturer string
}

func (c *Car) Drive() {
    c.Engine.Start()
    fmt.Printf("Driving %s %s\n", c.Manufacturer, c.Model)
}

func main() {
    car := Car{
        Engine: Engine{
            Power: 250,
            Type:  "V8",
        },
        Model: "Mustang",
        Manufacturer: "Ford",
    }

    car.Drive()
    // Explicit access to composed type's methods
    car.Engine.Start()
}
```

In this example, `Car` has-an `Engine` rather than is-an `Engine`. This approach:

- Favors explicit relationships over implicit ones
- Creates more flexible designs
- Allows for better component reuse

### **10.3.2 Struct Embedding**

Embedding provides a more elegant way to compose structs:

```go
package main

import "fmt"

type Engine struct {
    Power int
    Type  string
}

func (e Engine) Start() {
    fmt.Printf("Engine started: %s with %d horsepower\n", e.Type, e.Power)
}

// Car embeds Engine
type Car struct {
    Engine      // Embedded (anonymous field)
    Model       string
    Manufacturer string
}

func (c Car) Info() string {
    return fmt.Sprintf("%s %s", c.Manufacturer, c.Model)
}

func main() {
    car := Car{
        Engine: Engine{
            Power: 250,
            Type:  "V8",
        },
        Model:       "Mustang",
        Manufacturer: "Ford",
    }

    // Methods from embedded types are "promoted"
    car.Start()  // Calls Engine.Start()

    // Fields from embedded types are also promoted
    fmt.Printf("Engine type: %s\n", car.Type)
    fmt.Printf("Car info: %s\n", car.Info())
}
```

Key aspects of embedding:

- Fields and methods of embedded types are "promoted" to the containing type
- The embedded type's name becomes the field name if not specified
- Embedding creates an implicit has-a relationship, not is-a
- Promoted methods operate on the embedded value, not the containing struct

### **10.3.3 Multiple Embedding and Method Resolution**

Go allows embedding multiple types, with rules for name resolution:

```go
package main

import "fmt"

type Logger struct{}

func (l Logger) Log(message string) {
    fmt.Println("Log:", message)
}

type Engine struct {
    Power int
}

func (e Engine) Start() {
    fmt.Printf("Engine started with %d horsepower\n", e.Power)
}

// Car embeds both Engine and Logger
type Car struct {
    Engine
    Logger
    Model string
}

// Car overrides the Start method
func (c Car) Start() {
    c.Logger.Log("Car starting") // Use embedded Logger
    c.Engine.Start()             // Call embedded Engine's Start
    fmt.Printf("Car started: %s\n", c.Model)
}

func main() {
    car := Car{
        Engine: Engine{Power: 250},
        Model:  "Mustang",
    }

    car.Start()      // Calls Car's Start method
    car.Log("Test")  // Calls promoted Log method from Logger
}
```

Rules for name resolution with multiple embedding:

1. If the containing struct has the method/field, it takes precedence
2. If only one embedded type has the method/field, it's promoted
3. If multiple embedded types have the same method/field, you must specify which one to use

### **10.3.4 Interface Embedding**

Interfaces can also be embedded within other interfaces:

```go
package main

import "fmt"

// Basic interfaces
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// Embedded interface
type ReadWriter interface {
    Reader  // Embeds Reader interface
    Writer  // Embeds Writer interface
}

// Implementation
type FileReadWriter struct {
    filename string
}

func (frw FileReadWriter) Read(p []byte) (n int, err error) {
    fmt.Println("Reading from", frw.filename)
    return len(p), nil
}

func (frw FileReadWriter) Write(p []byte) (n int, err error) {
    fmt.Println("Writing to", frw.filename)
    return len(p), nil
}

func main() {
    var rw ReadWriter = FileReadWriter{filename: "data.txt"}

    data := []byte("Hello, World!")
    rw.Write(data)
    rw.Read(make([]byte, 128))
}
```

Interface embedding allows you to create larger interfaces from smaller ones, promoting modularity and the interface segregation principle.

## **10.4 Structs and Memory**

### **10.4.1 Memory Layout and Alignment**

Understanding struct memory layout helps optimize memory usage:

```go
package main

import (
    "fmt"
    "unsafe"
)

// Inefficient memory layout
type BadLayout struct {
    a bool    // 1 byte
    b int64   // 8 bytes
    c bool    // 1 byte
    // Contains padding due to alignment requirements
}

// Better memory layout
type GoodLayout struct {
    b int64   // 8 bytes
    a bool    // 1 byte
    c bool    // 1 byte
    // Minimizes padding
}

func main() {
    fmt.Printf("Size of BadLayout: %d bytes\n", unsafe.Sizeof(BadLayout{}))
    fmt.Printf("Size of GoodLayout: %d bytes\n", unsafe.Sizeof(GoodLayout{}))

    // Examine alignment
    var bad BadLayout
    var good GoodLayout

    fmt.Printf("Alignment of bad.a: %d\n", unsafe.Alignof(bad.a))
    fmt.Printf("Alignment of bad.b: %d\n", unsafe.Alignof(bad.b))
    fmt.Printf("Alignment of good.a: %d\n", unsafe.Alignof(good.a))
    fmt.Printf("Alignment of good.b: %d\n", unsafe.Alignof(good.b))
}
```

Tips for memory optimization:

1. Order struct fields from largest to smallest to minimize padding
2. Group fields of the same size together
3. Consider alignment requirements (typically same as size)
4. Use tools like `unsafe.Sizeof()` to check struct size

### **10.4.2 Struct Copying and Performance**

Since structs are value types, copying behavior affects performance:

```go
package main

import (
    "fmt"
    "time"
)

type LargeStruct struct {
    data [1024]int
}

func modifyValue(s LargeStruct) {
    s.data[0] = 100 // Modifies a copy
}

func modifyPointer(s *LargeStruct) {
    s.data[0] = 100 // Modifies original
}

func main() {
    original := LargeStruct{}

    // Measure time to copy 1 million times
    start := time.Now()
    for i := 0; i < 1000000; i++ {
        copy := original // Creates a full copy
        copy.data[0] = i
    }
    fmt.Printf("Value copying took: %v\n", time.Since(start))

    // Measure time to use pointers 1 million times
    start = time.Now()
    for i := 0; i < 1000000; i++ {
        ptr := &original // Only copies a pointer
        ptr.data[0] = i
    }
    fmt.Printf("Pointer usage took: %v\n", time.Since(start))
}
```

When to use pointers with structs:

1. When working with large structs to avoid expensive copying
2. When methods need to modify the struct
3. When passing structs to functions that modify them
4. When implementing interfaces with pointer receivers

### **10.4.3 Inlining and Compiler Optimizations**

Go's compiler performs various optimizations with structs:

```go
package main

import "fmt"

type Point struct {
    X, Y int
}

// Small function that's likely to be inlined
func (p Point) Distance(q Point) int {
    dx := p.X - q.X
    dy := p.Y - q.Y
    return dx*dx + dy*dy
}

func main() {
    p1 := Point{1, 2}
    p2 := Point{4, 6}

    // This call may be inlined by the compiler
    distance := p1.Distance(p2)

    fmt.Println("Distance:", distance)

    // Build with optimizations:
    // go build -gcflags="-m" main.go
}
```

Compiler optimizations related to structs include:

1. **Inlining**: Small methods are inserted at the call site
2. **Escape Analysis**: Determines when structs can stay on the stack
3. **Dead field elimination**: Removes unused fields
4. **Copy elision**: Avoids unnecessary copying when safe

## **10.5 Advanced Struct Patterns**

### **10.5.1 Functional Options Pattern**

The functional options pattern provides a flexible way to configure structs:

```go
package main

import (
    "fmt"
    "time"
)

type Server struct {
    host    string
    port    int
    timeout time.Duration
    maxConn int
    tls     bool
}

// Option is a function type that modifies a Server
type Option func(*Server)

// WithPort sets the server port
func WithPort(port int) Option {
    return func(s *Server) {
        s.port = port
    }
}

// WithTimeout sets the server timeout
func WithTimeout(timeout time.Duration) Option {
    return func(s *Server) {
        s.timeout = timeout
    }
}

// WithTLS enables TLS
func WithTLS() Option {
    return func(s *Server) {
        s.tls = true
    }
}

// WithMaxConn sets the maximum connections
func WithMaxConn(n int) Option {
    return func(s *Server) {
        s.maxConn = n
    }
}

// NewServer creates a server with the given options
func NewServer(host string, options ...Option) *Server {
    // Default configuration
    server := &Server{
        host:    host,
        port:    8080,
        timeout: 30 * time.Second,
        maxConn: 100,
        tls:     false,
    }

    // Apply all options
    for _, option := range options {
        option(server)
    }

    return server
}

func main() {
    // Create with defaults
    server1 := NewServer("localhost")

    // Create with custom options
    server2 := NewServer("example.com",
        WithPort(443),
        WithTLS(),
        WithMaxConn(1000),
    )

    fmt.Printf("Server 1: %+v\n", server1)
    fmt.Printf("Server 2: %+v\n", server2)
}
```

Benefits of the functional options pattern:

1. Provides a clean API with defaults
2. Makes optional parameters explicit and named
3. Allows for future extensions without breaking the API
4. Options can be packaged and reused

### **10.5.2 Builder Pattern**

The builder pattern helps construct complex objects step by step:

```go
package main

import "fmt"

type EmailMessage struct {
    from    string
    to      []string
    cc      []string
    subject string
    body    string
    html    bool
}

type EmailBuilder struct {
    message EmailMessage
}

func NewEmailBuilder() *EmailBuilder {
    return &EmailBuilder{
        message: EmailMessage{
            to: make([]string, 0),
            cc: make([]string, 0),
        },
    }
}

func (b *EmailBuilder) From(from string) *EmailBuilder {
    b.message.from = from
    return b
}

func (b *EmailBuilder) To(to ...string) *EmailBuilder {
    b.message.to = append(b.message.to, to...)
    return b
}

func (b *EmailBuilder) CC(cc ...string) *EmailBuilder {
    b.message.cc = append(b.message.cc, cc...)
    return b
}

func (b *EmailBuilder) Subject(subject string) *EmailBuilder {
    b.message.subject = subject
    return b
}

func (b *EmailBuilder) Body(body string, html bool) *EmailBuilder {
    b.message.body = body
    b.message.html = html
    return b
}

func (b *EmailBuilder) Build() EmailMessage {
    return b.message
}

func main() {
    email := NewEmailBuilder().
        From("sender@example.com").
        To("recipient1@example.com", "recipient2@example.com").
        CC("manager@example.com").
        Subject("Meeting Agenda").
        Body("<h1>Agenda Items</h1><p>Discuss project status</p>", true).
        Build()

    fmt.Printf("Email: %+v\n", email)
}
```

The builder pattern is useful when:

- Objects have many parameters, some optional
- Construction involves multiple steps
- Different representations of the same object are needed
- Immutable objects need to be created

### **10.5.3 Type-Safe Enums with Constant Types**

Go doesn't have built-in enums, but you can create type-safe enumeration with structs and constants:

```go
package main

import "fmt"

// Define a new type
type Weekday int

// Define constants of that type
const (
    Monday Weekday = iota + 1
    Tuesday
    Wednesday
    Thursday
    Friday
    Saturday
    Sunday
)

// Add a method to the type to get string representation
func (d Weekday) String() string {
    names := map[Weekday]string{
        Monday:    "Monday",
        Tuesday:   "Tuesday",
        Wednesday: "Wednesday",
        Thursday:  "Thursday",
        Friday:    "Friday",
        Saturday:  "Saturday",
        Sunday:    "Sunday",
    }

    if name, ok := names[d]; ok {
        return name
    }
    return fmt.Sprintf("Unknown weekday (%d)", d)
}

// IsWeekend method for the enum
func (d Weekday) IsWeekend() bool {
    return d == Saturday || d == Sunday
}

func main() {
    today := Friday

    fmt.Println("Today is", today)
    fmt.Println("Is today a weekend?", today.IsWeekend())

    tomorrow := Saturday
    fmt.Println("Tomorrow is", tomorrow)
    fmt.Println("Is tomorrow a weekend?", tomorrow.IsWeekend())
}
```

Benefits of this approach:

1. Type safety (cannot use other integers where Weekday is expected)
2. Self-documenting code with named constants
3. Ability to add methods to the enum type
4. Compatibility with the Stringer interface for string representation

### **10.5.4 Immutable Structs**

Creating immutable structs in Go:

```go
package main

import "fmt"

// Immutable Point type
type Point struct {
    x int
    y int
}

// Constructor function (since fields are unexported)
func NewPoint(x, y int) Point {
    return Point{x: x, y: y}
}

// Getter methods
func (p Point) X() int { return p.x }
func (p Point) Y() int { return p.y }

// Operations return new Points instead of modifying
func (p Point) Add(q Point) Point {
    return Point{
        x: p.x + q.x,
        y: p.y + q.y,
    }
}

func (p Point) Scale(factor int) Point {
    return Point{
        x: p.x * factor,
        y: p.y * factor,
    }
}

func main() {
    p1 := NewPoint(10, 20)

    // Can't modify p1 directly
    // p1.x = 15  // Compilation error: x is unexported

    // Create new points through operations
    p2 := p1.Add(NewPoint(5, 5))
    p3 := p1.Scale(2)

    fmt.Printf("p1: (%d, %d)\n", p1.X(), p1.Y())
    fmt.Printf("p2: (%d, %d)\n", p2.X(), p2.Y())
    fmt.Printf("p3: (%d, %d)\n", p3.X(), p3.Y())
}
```

Techniques for immutability:

1. Make fields unexported (lowercase)
2. Provide getter methods but no setters
3. Return new instances instead of modifying
4. Use constructor functions to create valid instances

## **10.6 Summary**

In this chapter, we've explored Go's approach to object-oriented programming through structs and methods. Key takeaways include:

- **Structs** provide a way to combine related data into custom types
- **Methods** allow you to add behavior to types without traditional inheritance
- **Composition** through embedding offers a flexible alternative to inheritance
- **Value vs. pointer receivers** control whether methods modify their receivers
- **Advanced patterns** like functional options and builders provide elegant APIs

Go's approach encourages simplicity and explicitness over complex hierarchies, resulting in code that is easier to understand and maintain. By focusing on composition over inheritance and clear data ownership, Go helps you build robust and modular systems.

**Next Up**: In Chapter 11, we'll explore concurrency in Go, including goroutines and channels, which build on your understanding of Go's type system.
