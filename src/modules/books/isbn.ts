/**
 * [INPUT]: 零依赖，纯函数
 * [OUTPUT]: 对外提供 isbnUid（把一串 ISBN 变成能当 UID 的数字）
 * [POS]: 书的身份证号这件事的唯一实现。
 *        全库每篇笔记都有一个 UID，别的笔记那是 14 位时间戳——因为它们没有别的身份；
 *        书有：ISBN 是国际标准书号，同一本书在任何一台机器、任何一个库里都是同一串数字。
 *        让书的 UID 就是它的 ISBN，等于让「这两篇笔记是不是同一本书」变成一次数字比对，
 *        而不是比对书名（同名书、繁简、副标题写不写，全都会让书名比对失手）。
 *        两处约束决定了这个文件的全部形状：
 *        其一，UID 在 `.obsidian/types.json` 里登记为 **number**，属性类型是全库共享的一张表，
 *        某一篇写成字符串就与其余笔记不同构，而这种不同构既不报错也没有任何视图会挡下；
 *        因此本文件的产出必须是数字，拿不出数字就交 null 让调用方回落到时间戳。
 *        其二，ISBN 有两代：13 位纯数字（2007 年之后）与 10 位、末位可能是字母 X（老书），
 *        两代都先验证国际标准校验位，错误号码绝不能进入全库主键。
 *        后者直接当数字是不可能的，所以按国际标准换算成 978 开头的 13 位——
 *        这是一次无损转换（同一本书的两种写法），不是猜测，因此老书也照样拿得到它的真号
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/**
 * 把 ISBN 转成可以直接写进 UID 的数字；转不出来返回 null。
 *
 * 13 位原样取用（9787115564672 ≈ 9.8e12，远在 JavaScript 安全整数 9007199254740991 之内，
 * 不会重蹈 17 位 UID 那种「落盘即被静默四舍五入」的覆辙，见 constants 的 UID_FORMAT）。
 * 10 位换算成 13 位。其余一律 null——豆瓣没给、给了个残缺串、或者根本是电子书没有书号，
 * 那时回落到时间戳 UID 才是老实做法，硬凑一个数字出来会污染主键。
 */
export function isbnUid(raw: string): number | null {
    // 豆瓣的 ISBN 字段偶尔带连字符或空格，先剥成裸串再论长短
    const compact = raw.replace(/[^0-9Xx]/g, '').toUpperCase();

    if (/^\d{13}$/.test(compact) && validIsbn13(compact)) return Number(compact);
    if (/^\d{9}[\dX]$/.test(compact) && validIsbn10(compact)) return Number(toIsbn13(compact));

    return null;
}

/** ISBN-13：978/979 前缀，前十二位按 1、3 交替加权后能推出末位校验码 */
function validIsbn13(isbn: string): boolean {
    if (!/^97[89]/.test(isbn)) return false;

    let sum = 0;

    for (let index = 0; index < 12; index += 1) {
        sum += Number(isbn[index]) * (index % 2 === 0 ? 1 : 3);
    }

    return (10 - (sum % 10)) % 10 === Number(isbn[12]);
}

/** ISBN-10：十位按 10 到 1 递减加权，总和必须能被 11 整除 */
function validIsbn10(isbn: string): boolean {
    let sum = 0;

    for (let index = 0; index < isbn.length; index += 1) {
        const digit = isbn[index] === 'X' ? 10 : Number(isbn[index]);

        sum += digit * (10 - index);
    }

    return sum % 11 === 0;
}

/**
 * ISBN-10 → ISBN-13：换掉前缀、重算校验位。
 *
 * 老号的末位校验码是按 ISBN-10 的模 11 算的（所以才可能是 X），换成 13 位之后
 * 整个校验规则变成模 10，必须重算——照抄旧校验位会得到一个合法长度但非法的号，
 * 而它看上去和真号一模一样。前九位数字是书本身的身份，一位不动。
 */
function toIsbn13(isbn10: string): string {
    const body = `978${isbn10.slice(0, 9)}`;
    let sum = 0;

    // 模 10 校验：从左到右按 1、3 交替加权
    for (let index = 0; index < body.length; index += 1) {
        sum += Number(body[index]) * (index % 2 === 0 ? 1 : 3);
    }

    return `${body}${(10 - (sum % 10)) % 10}`;
}
