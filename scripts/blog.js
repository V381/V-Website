// scripts/blog.js
// Funkcija koja fetch-uje sve markdown fajlove iz blog foldera

const GITHUB_USERNAME = 'V381';  
const REPO_NAME = 'V-Website';             
const BRANCH = 'main';                           

async function fetchBlogPosts() {
    try {
        // GitHub API endpoint za sadržaj blog foldera
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/blog`);
        
        if (!response.ok) {
            console.error('GitHub API error:', response.status);
            return [];
        }
        
        const files = await response.json();
        
        // Filtriraj samo .md fajlove
        const markdownFiles = files.filter(file => file.name.endsWith('.md'));
        
        if (markdownFiles.length === 0) {
            return [];
        }
        
        // Fetch sadržaj svakog markdown fajla
        const posts = await Promise.all(
            markdownFiles.map(async (file) => {
                try {
                    const contentResponse = await fetch(file.download_url);
                    const content = await contentResponse.text();
                    
                    // Parse front matter (YAML na početku fajla)
                    const frontMatter = parseFrontMatter(content);
                    
                    return {
                        slug: file.name.replace('.md', ''),
                        ...frontMatter
                    };
                } catch (error) {
                    console.error(`Error fetching ${file.name}:`, error);
                    return null;
                }
            })
        );
        
        // Filtriraj null vrednosti (fajlovi koji nisu uspešno učitani)
        const validPosts = posts.filter(post => post !== null);
        
        // Sortiraj po datumu (najnoviji prvi)
        validPosts.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        });
        
        return validPosts;
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return [];
    }
}

// Funkcija za parsiranje front matter-a (YAML na početku markdown fajla)
function parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
        return { 
            body: content,
            title: 'Untitled Post',
            date: new Date().toISOString(),
            author: 'The MB Superb Team'
        };
    }
    
    const frontMatter = {};
    const lines = match[1].split('\n');
    
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return;
        
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // Ukloni navodnike ako postoje
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        
        // Posebna obrada za liste (tags)
        if (value.startsWith('[') && value.endsWith(']')) {
            // Jednostavno parsiranje liste
            value = value.slice(1, -1).replace(/['"]/g, '').trim();
        }
        
        frontMatter[key] = value;
    });
    
    frontMatter.body = match[2].trim();
    
    return frontMatter;
}

// Funkcija za učitavanje pojedinačnog posta
async function fetchSinglePost(slug) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH}/blog/${slug}.md`);
        
        if (!response.ok) {
            console.error('Error fetching post:', response.status);
            return null;
        }
        
        const content = await response.text();
        
        return parseFrontMatter(content);
    } catch (error) {
        console.error('Error fetching post:', error);
        return null;
    }
}

// Funkcija za formatiranje datuma
function formatDate(dateString) {
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// Export funkcija ako koristiš module (opcionalno)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchBlogPosts,
        fetchSinglePost,
        formatDate
    };
}