// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><a href="chapters/Chapter-1-introduction-to-go.html"><strong aria-hidden="true">1.</strong> Introduction to Go</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-2-Essential-Go-Tooling.html"><strong aria-hidden="true">2.</strong> Essential Go Tooling</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-3-Variables-Constants-and-Data-Types.html"><strong aria-hidden="true">3.</strong> Variables, Constants, and Data Types</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-4-Operators-and-Expressions.html"><strong aria-hidden="true">4.</strong> Operators and Expressions</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-5-Control-Structures.html"><strong aria-hidden="true">5.</strong> Control Structures</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-6-Functions.html"><strong aria-hidden="true">6.</strong> Functions</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-7-Error-Handling.html"><strong aria-hidden="true">7.</strong> Error Handling</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-8-Packages-and-Modules.html"><strong aria-hidden="true">8.</strong> Packages and Modules</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-9-Arrays-Slices-Strings.html"><strong aria-hidden="true">9.</strong> Arrays, Slices, and Strings</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-10-Maps-and-Pointers.html"><strong aria-hidden="true">10.</strong> Maps and Pointers</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-11-Structs-and-Methods.html"><strong aria-hidden="true">11.</strong> Structs and Methods</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-12-Goroutines.html"><strong aria-hidden="true">12.</strong> Goroutines</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-13-Channels.html"><strong aria-hidden="true">13.</strong> Channels</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-14-Concurrency-Patterns.html"><strong aria-hidden="true">14.</strong> Concurrency Patterns</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-15-Common-Packages.html"><strong aria-hidden="true">15.</strong> Common Packages</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-16-File-IO.html"><strong aria-hidden="true">16.</strong> File I/O</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-17-Testing.html"><strong aria-hidden="true">17.</strong> Testing</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-18-Interfaces.html"><strong aria-hidden="true">18.</strong> Interfaces</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-19-Reflection.html"><strong aria-hidden="true">19.</strong> Reflection</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-20-Generics.html"><strong aria-hidden="true">20.</strong> Generics</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-21-Databases.html"><strong aria-hidden="true">21.</strong> Databases</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-22-Building-RESTful-APIs.html"><strong aria-hidden="true">22.</strong> Building RESTful APIs</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-23-Microservices.html"><strong aria-hidden="true">23.</strong> Microservices</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-24-Clean-Code.html"><strong aria-hidden="true">24.</strong> Clean Code</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-25-Design-Patterns.html"><strong aria-hidden="true">25.</strong> Design Patterns</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-26-Performance.html"><strong aria-hidden="true">26.</strong> Performance</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-27-CLI-Tools.html"><strong aria-hidden="true">27.</strong> CLI Tools</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-28-Platform-Engineering.html"><strong aria-hidden="true">28.</strong> Platform Engineering</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-29-Event-Driven-Architecture.html"><strong aria-hidden="true">29.</strong> Event-Driven Architecture</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-30-Domain-Driven-Design.html"><strong aria-hidden="true">30.</strong> Domain-Driven Design</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-31-Observability-Driven-Development.html"><strong aria-hidden="true">31.</strong> Observability-Driven Development</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-32-Go-for-Production.html"><strong aria-hidden="true">32.</strong> Go for Production</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-33-Enterprise-Grade-Security.html"><strong aria-hidden="true">33.</strong> Enterprise-Grade Security</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-34-High-Performance-Go.html"><strong aria-hidden="true">34.</strong> High-Performance Go</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-35-Cloud-Native-Go.html"><strong aria-hidden="true">35.</strong> Cloud-Native Go</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-36-Go-for-AI-and-LLMs.html"><strong aria-hidden="true">36.</strong> Go for AI and LLMs</a></li><li class="chapter-item expanded "><a href="chapters/Chapter-37-Go-for-Blockchain-and-Crypto.html"><strong aria-hidden="true">37.</strong> Go for Blockchain and Crypto</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
